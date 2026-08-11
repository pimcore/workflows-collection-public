// Shared helpers for the PR and repo guardrail workflows.
//
// SECURITY: These helpers are invoked only from `pull_request_target` / `issues`
// workflows that check out the trusted base ref. PR head code is NEVER checked
// out or executed. PR and issue titles/bodies are treated strictly as untrusted
// data (regex-parsed only), never interpolated as code or commands.
//
// Configuration can be overridden per workflow via environment variables
// (GUARD_ORG, GUARD_TEAM_SLUG, GUARD_ISSUE_OWNER, GUARD_ISSUE_REPO,
// GUARD_ISSUE_ALLOWLIST, and GUARD_BOT_LOGIN — the service account the
// guardrails act as) without editing this file.
//
// The `context` argument of the comment/label helpers is only ever read for
// `context.repo` and `context.payload.pull_request.number`, so a cross-repo
// caller (e.g. the stale-draft sweeper in pimcore/workflows-centralized) can
// pass a shim `{ repo: { owner, repo }, payload: {} }` together with an explicit
// `issueNumber` and reuse them unchanged.

const ORG = process.env.GUARD_ORG || 'pimcore';
const TEAM_SLUG = process.env.GUARD_TEAM_SLUG || 'dev-team'; // slug of the "Dev-Team" GitHub team
const ISSUE_REPO_OWNER = process.env.GUARD_ISSUE_OWNER || 'pimcore';
const ISSUE_REPO_NAME = process.env.GUARD_ISSUE_REPO || 'platform-version';
// Service account the guardrails act as (drafts PRs, comments). It is itself a
// Dev-Team member, so override retraction must ignore draft-conversions by it.
const GUARD_BOT = process.env.GUARD_BOT_LOGIN || 'pimcore-deployments';
// Only PRs created on/after this date are checked; older PRs are exempt. Empty
// disables the date gate. ISO date (UTC) — e.g. "2026-07-07".
const START_DATE = process.env.GUARD_START_DATE || '2026-07-07';

// Marker tags of every guardrail that posts a failure comment. Kept here so a
// bypass can clear all of them without each caller re-listing the markers.
// Their presence on a draft PR is also what proves a guardrail drafted it, which
// is how the stale-draft sweeper tells a guardrail-drafted PR apart from a
// contributor's own work-in-progress draft.
const GUARDRAIL_MARKERS = ['guardrail:issue-link', 'guardrail:ci-status'];

// Accounts whose issues/PRs the guardrails never act on, beyond the generic bot
// detection below: automation that legitimately files issues in these repos.
// Mirrors the allowlist in reusable-cla-check.yaml.
const ISSUE_ALLOWLIST = (process.env.GUARD_ISSUE_ALLOWLIST || 'Copilot,claude,pimcore-deployments')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// GitHub's supported issue-closing keywords.
const CLOSING_KEYWORDS = [
  'close', 'closes', 'closed',
  'fix', 'fixes', 'fixed',
  'resolve', 'resolves', 'resolved',
];

/**
 * True if the PR predates the guardrail start date and is therefore exempt.
 * Older PRs (opened before START_DATE) are not checked. Returns false if no
 * start date is configured or the PR has no created_at.
 */
function isExemptByAge(pr, startDate = START_DATE) {
  if (!startDate || !pr || !pr.created_at) return false;
  return new Date(pr.created_at).getTime() < new Date(startDate).getTime();
}

/**
 * Returns true if `username` is an active member of org/teamSlug.
 * Requires a token with `read:org` that can see the team.
 */
async function isDevTeamMember({ github, username, org = ORG, teamSlug = TEAM_SLUG }) {
  try {
    const res = await github.rest.teams.getMembershipForUserInOrg({
      org,
      team_slug: teamSlug,
      username,
    });
    return res.data.state === 'active';
  } catch (err) {
    if (err.status === 404) return false; // not a member
    throw err;
  }
}

/**
 * Assert that the token can see `org`'s FULL membership, including members whose
 * membership is private.
 *
 * `GET /orgs/{org}/members/{username}` answers 302 when the requester is not an
 * org member, redirecting to the public-members endpoint — and Octokit follows
 * that redirect transparently. A non-member token therefore returns clean
 * 204/404 answers that only reflect *public* membership, which would report every
 * privately-listed Pimcore employee as an outsider. Nothing in the response
 * distinguishes that from a real answer, so the only safe check is up front:
 * confirm the token's own account is a member of the org.
 *
 * Throws when it is not, so a mis-scoped token fails the guardrail loudly instead
 * of closing employees' issues.
 */
async function assertCanReadOrgMembership({ github, org = ORG }) {
  try {
    const res = await github.rest.orgs.getMembershipForAuthenticatedUser({ org });
    if (res.data.state !== 'active') {
      throw new Error(`token's account has state "${res.data.state}" in ${org}, not "active"`);
    }
  } catch (err) {
    if (err.status === 404 || err.status === 403) {
      throw new Error(
        `token cannot read ${org} membership: its account is not an active member of the org ` +
          `(needs read:org). Refusing to classify anyone as a non-member.`,
      );
    }
    throw err;
  }
}

/**
 * Returns true if `username` is a member of `org`, public or private membership.
 * Call `assertCanReadOrgMembership` once first — see its note on the 302 redirect;
 * without that preflight a mis-scoped token reports private members as outsiders.
 */
async function isOrgMember({ github, username, org = ORG }) {
  try {
    await github.rest.orgs.checkMembershipForUser({ org, username });
    return true; // 204 = member
  } catch (err) {
    if (err.status === 404) return false; // not a member
    throw err;
  }
}

/**
 * True if `user` (a GitHub user object) is automation rather than a person:
 * a Bot account, a `…[bot]` login, the guard service account, or an explicitly
 * allowlisted automation login. Guardrails never act on these.
 */
function isBotActor(user, allowlist = ISSUE_ALLOWLIST) {
  if (!user || !user.login) return false;
  const login = user.login.toLowerCase();
  return (
    user.type === 'Bot' ||
    login.endsWith('[bot]') ||
    login === GUARD_BOT.toLowerCase() ||
    allowlist.includes(login)
  );
}

/**
 * Parse closing-keyword issue references from arbitrary text.
 * Matches `keyword #123`, `keyword owner/repo#123`, and
 * `keyword https://github.com/owner/repo/issues/123`.
 * Returns array of { keyword, owner, repo, number, raw }.
 */
function parseIssueReferences(text, { defaultOwner = ISSUE_REPO_OWNER, defaultRepo = ISSUE_REPO_NAME } = {}) {
  if (!text) return [];
  const refs = [];
  const kw = CLOSING_KEYWORDS.join('|');

  // keyword [owner/repo]#123
  const shortRe = new RegExp(`\\b(${kw})\\b\\s*:?\\s+(?:([\\w.-]+)\\/([\\w.-]+))?#(\\d+)`, 'gi');
  let m;
  while ((m = shortRe.exec(text)) !== null) {
    refs.push({
      keyword: m[1].toLowerCase(),
      owner: m[2] || defaultOwner,
      repo: m[3] || defaultRepo,
      number: parseInt(m[4], 10),
      raw: m[0].trim().replace(/\s+/g, ' '),
    });
  }

  // keyword https://github.com/owner/repo/issues/123
  const urlRe = new RegExp(`\\b(${kw})\\b\\s*:?\\s+https?:\\/\\/github\\.com\\/([\\w.-]+)\\/([\\w.-]+)\\/issues\\/(\\d+)`, 'gi');
  while ((m = urlRe.exec(text)) !== null) {
    refs.push({
      keyword: m[1].toLowerCase(),
      owner: m[2],
      repo: m[3],
      number: parseInt(m[4], 10),
      raw: m[0].trim().replace(/\s+/g, ' '),
    });
  }

  return refs;
}

/**
 * Validate that an issue reference points to a real, existing issue (not a pull
 * request). The issue may be open or closed — state is returned for the caller,
 * but a closed tracking issue is still a valid link. Returns { valid, reason?, state? }.
 */
async function validateIssue({ github, owner, repo, number }) {
  try {
    const res = await github.rest.issues.get({ owner, repo, issue_number: number });
    if (res.data.pull_request) {
      return { valid: false, reason: 'reference points to a pull request, not an issue' };
    }
    return { valid: true, state: res.data.state };
  } catch (err) {
    if (err.status === 404) return { valid: false, reason: 'issue not found' };
    if (err.status === 401 || err.status === 403) {
      return { valid: false, reason: 'token cannot access this issue (check token scopes)' };
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a PR, polling until GitHub finishes computing `mergeable` (which is
 * null for a short window after each push). Returns the PR object; `mergeable`
 * may still be null if the computation did not settle within the budget, in
 * which case callers should treat it as "pending", not "failed".
 */
async function getMergeablePullRequest({ github, owner, repo, prNumber, attempts = 5, delayMs = 3000 }) {
  let pr;
  for (let i = 0; i < attempts; i++) {
    ({ data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber }));
    if (pr.mergeable !== null || pr.state !== 'open') return pr;
    await sleep(delayMs);
  }
  return pr;
}

/** Convert a pull request to draft via GraphQL. Idempotent: if the PR is already
 *  a draft (e.g. two guardrail jobs race), the "already a draft" error is ignored. */
async function convertToDraft({ github, pullRequestNodeId }) {
  try {
    await github.graphql(
      `mutation($id: ID!) {
         convertPullRequestToDraft(input: { pullRequestId: $id }) {
           pullRequest { isDraft }
         }
       }`,
      { id: pullRequestNodeId },
    );
  } catch (err) {
    if (String(err && err.message || '').toLowerCase().includes('draft')) return; // already a draft
    throw err;
  }
}

/** The HTML tag a marker comment is identified by. */
function markerTag(marker) {
  return `<!-- ${marker} -->`;
}

/**
 * Find the guard bot's marker comments for one or more markers, oldest first.
 *
 * Only OUR OWN comments (authored by the guard bot) ever match, so a human
 * comment that happens to quote a marker is never picked up, mutated or deleted.
 * Pass `comments` to reuse a listing the caller already has (the stale-draft
 * sweeper lists each PR's comments once and derives several things from them).
 */
async function getMarkerComments({ github, context, issueNumber, markers, comments }) {
  const tags = (Array.isArray(markers) ? markers : [markers]).map(markerTag);
  if (tags.length === 0) return [];

  const all = comments || (await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber || context.payload.pull_request.number,
    per_page: 100,
  }));

  return all
    .filter((c) => c.user && c.user.login === GUARD_BOT && c.body && tags.some((t) => c.body.includes(t)))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * Create or update a single marker comment so re-runs update in place instead
 * of posting duplicate comments.
 */
async function upsertComment({ github, context, issueNumber, marker, body }) {
  const { owner, repo } = context.repo;
  const issue_number = issueNumber || context.payload.pull_request.number;
  const fullBody = `${body}\n\n${markerTag(marker)}`;

  // Handle duplicates (e.g. from a prior race): update the first and delete any extras.
  const matches = await getMarkerComments({ github, context, issueNumber: issue_number, markers: [marker] });

  if (matches.length === 0) {
    const { data } = await github.rest.issues.createComment({ owner, repo, issue_number, body: fullBody });
    return data;
  }
  const { data } = await github.rest.issues.updateComment({
    owner, repo, comment_id: matches[0].id, body: fullBody,
  });
  for (const dup of matches.slice(1)) {
    await github.rest.issues.deleteComment({ owner, repo, comment_id: dup.id });
  }
  return data;
}

/**
 * Delete the marker comments of one or more guardrails (used when a guardrail now
 * passes, or when a PR turns out to be bypassed, so a stale failure comment does
 * not linger). Lists the comments once for all markers. No-op when there is
 * nothing to remove. A comment another job deleted first (404) is not an error.
 * Returns the number of comments deleted.
 */
async function deleteMarkerComments({ github, context, issueNumber, markers, comments }) {
  const { owner, repo } = context.repo;
  const matches = await getMarkerComments({ github, context, issueNumber, markers, comments });
  let deleted = 0;
  for (const c of matches) {
    try {
      await github.rest.issues.deleteComment({ owner, repo, comment_id: c.id });
      deleted++;
    } catch (err) {
      // Another guardrail job may have deleted the same comment first (a
      // check_suite run and a PR run can overlap). Nothing left to do.
      if (err.status !== 404) throw err;
    }
  }
  return deleted;
}

/** Single-marker convenience wrapper around `deleteMarkerComments`. */
async function deleteMarkerComment({ github, context, issueNumber, marker }) {
  return deleteMarkerComments({ github, context, issueNumber, markers: [marker] });
}

/** Add a label to a PR/issue, creating the label in the repo if it is missing. */
async function addLabel({ github, context, issueNumber, label }) {
  const { owner, repo } = context.repo;
  const issue_number = issueNumber || context.payload.pull_request.number;
  try {
    await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [label] });
  } catch (err) {
    if (err.status === 404 || err.status === 422) {
      try {
        await github.rest.issues.createLabel({ owner, repo, name: label, color: '0e8a16' });
      } catch (_) {
        /* label may have been created concurrently — ignore */
      }
      await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [label] });
    } else {
      throw err;
    }
  }
}

/** Remove a label from a PR/issue. No-op if the label is not present. */
async function removeLabel({ github, context, issueNumber, label }) {
  const { owner, repo } = context.repo;
  const issue_number = issueNumber || context.payload.pull_request.number;
  try {
    await github.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
  } catch (err) {
    if (err.status === 404) return; // label not on the PR — nothing to do
    throw err;
  }
}

/** Short footer telling the author how to re-run the guardrails after fixing. */
const REVALIDATE_HINT = 'When fixed, press **Ready for review** to re-run the checks.';

module.exports = {
  ORG,
  TEAM_SLUG,
  ISSUE_REPO_OWNER,
  ISSUE_REPO_NAME,
  GUARD_BOT,
  START_DATE,
  CLOSING_KEYWORDS,
  GUARDRAIL_MARKERS,
  ISSUE_ALLOWLIST,
  REVALIDATE_HINT,
  isExemptByAge,
  isDevTeamMember,
  assertCanReadOrgMembership,
  isOrgMember,
  isBotActor,
  parseIssueReferences,
  validateIssue,
  getMergeablePullRequest,
  convertToDraft,
  markerTag,
  getMarkerComments,
  upsertComment,
  deleteMarkerComment,
  deleteMarkerComments,
  addLabel,
  removeLabel,
};
