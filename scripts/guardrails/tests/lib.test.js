// Tests for the shared guardrail helpers (node:test, no network).
//
// Focused on the parts where a mistake is expensive: marker comments are only
// ever the guard bot's own, membership lookups fail loud rather than guessing,
// and bot authors are never acted on.

const test = require('node:test');
const assert = require('node:assert');

const lib = require('../lib.js');

const BOT = lib.GUARD_BOT;
const ctx = { repo: { owner: 'pimcore', repo: 'demo' }, payload: {} };

/** Minimal Octokit double: records calls, serves a canned comment list. */
function fakeGithub({ comments = [], membership, checkMembership } = {}) {
  const calls = { created: [], updated: [], deleted: [], labels: [] };
  return {
    calls,
    paginate: async () => comments,
    graphql: async () => ({}),
    rest: {
      issues: {
        listComments: 'listComments',
        createComment: async (p) => { calls.created.push(p); return { data: { id: 999, ...p } }; },
        updateComment: async (p) => { calls.updated.push(p); return { data: { id: p.comment_id, ...p } }; },
        deleteComment: async (p) => { calls.deleted.push(p); return {}; },
        addLabels: async (p) => { calls.labels.push(p); return {}; },
        createLabel: async () => ({}),
      },
      orgs: {
        getMembershipForAuthenticatedUser: async () => {
          if (membership instanceof Error) throw membership;
          return { data: { state: membership } };
        },
        checkMembershipForUser: async () => {
          if (checkMembership instanceof Error) throw checkMembership;
          return { status: 204 };
        },
      },
    },
  };
}

function httpError(status) {
  const e = new Error(`HTTP ${status}`);
  e.status = status;
  return e;
}

function comment({ id, login = BOT, marker, created_at = '2026-01-01T00:00:00Z', body }) {
  return {
    id,
    user: { login },
    created_at,
    body: body !== undefined ? body : `text ${lib.markerTag(marker)}`,
  };
}

// ---------------------------------------------------------------- markers

test('getMarkerComments matches only the guard bot\'s own comments', async () => {
  const github = fakeGithub({
    comments: [
      comment({ id: 1, marker: 'guardrail:ci-status' }),
      // A human quoting the marker must never be picked up.
      comment({ id: 2, login: 'outside-contributor', marker: 'guardrail:ci-status' }),
    ],
  });
  const found = await lib.getMarkerComments({
    github, context: ctx, issueNumber: 7, markers: ['guardrail:ci-status'],
  });
  assert.deepStrictEqual(found.map((c) => c.id), [1]);
});

test('getMarkerComments returns oldest first across several markers', async () => {
  const github = fakeGithub({
    comments: [
      comment({ id: 2, marker: 'guardrail:ci-status', created_at: '2026-03-01T00:00:00Z' }),
      comment({ id: 1, marker: 'guardrail:issue-link', created_at: '2026-02-01T00:00:00Z' }),
    ],
  });
  const found = await lib.getMarkerComments({
    github, context: ctx, issueNumber: 7, markers: lib.GUARDRAIL_MARKERS,
  });
  assert.deepStrictEqual(found.map((c) => c.id), [1, 2]);
});

test('getMarkerComments with no markers returns empty without listing', async () => {
  const github = fakeGithub({});
  let paginated = false;
  github.paginate = async () => { paginated = true; return []; };
  assert.deepStrictEqual(
    await lib.getMarkerComments({ github, context: ctx, issueNumber: 7, markers: [] }),
    [],
  );
  assert.strictEqual(paginated, false);
});

// ---------------------------------------------------------------- upsert

test('upsertComment creates when no marker comment exists', async () => {
  const github = fakeGithub({ comments: [] });
  await lib.upsertComment({
    github, context: ctx, issueNumber: 7, marker: 'guardrail:stale-draft', body: 'hello',
  });
  assert.strictEqual(github.calls.created.length, 1);
  assert.strictEqual(github.calls.updated.length, 0);
  assert.match(github.calls.created[0].body, /hello\n\n<!-- guardrail:stale-draft -->/);
});

test('upsertComment updates in place and reaps duplicates from a prior race', async () => {
  const github = fakeGithub({
    comments: [
      comment({ id: 10, marker: 'guardrail:ci-status', created_at: '2026-01-01T00:00:00Z' }),
      comment({ id: 11, marker: 'guardrail:ci-status', created_at: '2026-01-02T00:00:00Z' }),
    ],
  });
  await lib.upsertComment({
    github, context: ctx, issueNumber: 7, marker: 'guardrail:ci-status', body: 'again',
  });
  assert.strictEqual(github.calls.created.length, 0);
  // Oldest is updated, the later duplicate deleted.
  assert.deepStrictEqual(github.calls.updated.map((c) => c.comment_id), [10]);
  assert.deepStrictEqual(github.calls.deleted.map((c) => c.comment_id), [11]);
});

test('upsertComment returns the comment so callers can read its timestamps', async () => {
  const github = fakeGithub({ comments: [] });
  const created = await lib.upsertComment({
    github, context: ctx, issueNumber: 7, marker: 'guardrail:stale-draft', body: 'x',
  });
  assert.strictEqual(created.id, 999);
});

// ---------------------------------------------------------------- delete

test('deleteMarkerComments removes every matching bot comment and counts them', async () => {
  const github = fakeGithub({
    comments: [
      comment({ id: 1, marker: 'guardrail:issue-link' }),
      comment({ id: 2, marker: 'guardrail:ci-status' }),
      comment({ id: 3, login: 'someone-else', marker: 'guardrail:ci-status' }),
      comment({ id: 4, marker: 'guardrail:unrelated' }),
    ],
  });
  const n = await lib.deleteMarkerComments({
    github, context: ctx, issueNumber: 7, markers: lib.GUARDRAIL_MARKERS,
  });
  assert.strictEqual(n, 2);
  assert.deepStrictEqual(github.calls.deleted.map((c) => c.comment_id).sort(), [1, 2]);
});

test('deleteMarkerComments tolerates a comment another job already deleted', async () => {
  const github = fakeGithub({ comments: [comment({ id: 1, marker: 'guardrail:ci-status' })] });
  github.rest.issues.deleteComment = async () => { throw httpError(404); };
  assert.strictEqual(
    await lib.deleteMarkerComments({
      github, context: ctx, issueNumber: 7, markers: ['guardrail:ci-status'],
    }),
    0,
  );
});

test('deleteMarkerComments propagates a real API failure', async () => {
  const github = fakeGithub({ comments: [comment({ id: 1, marker: 'guardrail:ci-status' })] });
  github.rest.issues.deleteComment = async () => { throw httpError(500); };
  await assert.rejects(
    lib.deleteMarkerComments({ github, context: ctx, issueNumber: 7, markers: ['guardrail:ci-status'] }),
    /HTTP 500/,
  );
});

test('deleteMarkerComment single-marker wrapper still works', async () => {
  const github = fakeGithub({ comments: [comment({ id: 1, marker: 'guardrail:ci-status' })] });
  assert.strictEqual(
    await lib.deleteMarkerComment({
      github, context: ctx, issueNumber: 7, marker: 'guardrail:ci-status',
    }),
    1,
  );
});

// ---------------------------------------------------------------- membership

test('assertCanReadOrgMembership passes for an active member token', async () => {
  await lib.assertCanReadOrgMembership({ github: fakeGithub({ membership: 'active' }), org: 'pimcore' });
});

test('assertCanReadOrgMembership throws for a pending membership', async () => {
  await assert.rejects(
    lib.assertCanReadOrgMembership({ github: fakeGithub({ membership: 'pending' }), org: 'pimcore' }),
    /not "active"/,
  );
});

test('assertCanReadOrgMembership throws when the token is not an org member', async () => {
  // This is the trap it exists for: GitHub would then answer only from PUBLIC
  // membership, silently reporting private members as outsiders.
  for (const status of [404, 403]) {
    await assert.rejects(
      lib.assertCanReadOrgMembership({ github: fakeGithub({ membership: httpError(status) }), org: 'pimcore' }),
      /not an active member/,
    );
  }
});

test('isOrgMember maps 204 to true and 404 to false', async () => {
  assert.strictEqual(await lib.isOrgMember({ github: fakeGithub({}), username: 'someone' }), true);
  assert.strictEqual(
    await lib.isOrgMember({ github: fakeGithub({ checkMembership: httpError(404) }), username: 'nobody' }),
    false,
  );
});

test('isOrgMember propagates transport errors instead of assuming non-member', async () => {
  await assert.rejects(
    lib.isOrgMember({ github: fakeGithub({ checkMembership: httpError(502) }), username: 'x' }),
    /HTTP 502/,
  );
});

// ---------------------------------------------------------------- bot actors

test('isBotActor recognises bots, the guard account and the allowlist', () => {
  assert.ok(lib.isBotActor({ login: 'dependabot[bot]', type: 'Bot' }));
  assert.ok(lib.isBotActor({ login: 'renovate[bot]', type: 'User' }));
  assert.ok(lib.isBotActor({ login: BOT, type: 'User' }));
  assert.ok(lib.isBotActor({ login: 'Copilot', type: 'User' }));
  assert.ok(lib.isBotActor({ login: 'CLAUDE', type: 'User' }), 'login match is case-insensitive');
});

test('isBotActor treats a normal contributor as human', () => {
  assert.ok(!lib.isBotActor({ login: 'outside-contributor', type: 'User' }));
  assert.ok(!lib.isBotActor(null));
  assert.ok(!lib.isBotActor({}));
});

// ---------------------------------------------------------------- age gate

test('isExemptByAge only exempts PRs opened before the start date', () => {
  assert.ok(lib.isExemptByAge({ created_at: '2026-07-06T23:59:59Z' }, '2026-07-07'));
  assert.ok(!lib.isExemptByAge({ created_at: '2026-07-07T00:00:00Z' }, '2026-07-07'));
  assert.ok(!lib.isExemptByAge({ created_at: '2026-07-06T00:00:00Z' }, ''), 'empty start date disables the gate');
  assert.ok(!lib.isExemptByAge({}, '2026-07-07'));
});
