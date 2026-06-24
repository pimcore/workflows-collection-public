// Shared helpers for the PR guardrail workflows.
//
// SECURITY: These helpers are invoked only from `pull_request_target` workflows
// that check out the trusted base ref. PR head code is NEVER checked out or
// executed. PR title/body are treated strictly as untrusted data (regex-parsed
// only), never interpolated as code or commands.
//
// Configuration can be overridden per workflow via environment variables
// (GUARD_ORG, GUARD_TEAM_SLUG, GUARD_ISSUE_OWNER, GUARD_ISSUE_REPO) without
// editing this file.

const ORG = process.env.GUARD_ORG || 'pimcore';
const TEAM_SLUG = process.env.GUARD_TEAM_SLUG || 'dev-team'; // slug of the "Dev-Team" GitHub team
const ISSUE_REPO_OWNER = process.env.GUARD_ISSUE_OWNER || 'pimcore';
const ISSUE_REPO_NAME = process.env.GUARD_ISSUE_REPO || 'platform-version';

// GitHub's supported issue-closing keywords.
const CLOSING_KEYWORDS = [
  'close', 'closes', 'closed',
  'fix', 'fixes', 'fixed',
  'resolve', 'resolves', 'resolved',
];

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
 * Validate that an issue reference points to a real, open issue (not a PR).
 * Returns { valid, reason?, state? }.
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

/** Convert a pull request to draft via GraphQL. */
async function convertToDraft({ github, pullRequestNodeId }) {
  await github.graphql(
    `mutation($id: ID!) {
       convertPullRequestToDraft(input: { pullRequestId: $id }) {
         pullRequest { isDraft }
       }
     }`,
    { id: pullRequestNodeId },
  );
}

/**
 * Create or update a single marker comment so re-runs update in place instead
 * of posting duplicate comments.
 */
async function upsertComment({ github, context, issueNumber, marker, body }) {
  const { owner, repo } = context.repo;
  const issue_number = issueNumber || context.payload.pull_request.number;
  const tag = `<!-- ${marker} -->`;
  const fullBody = `${body}\n\n${tag}`;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body && c.body.includes(tag));

  if (existing) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body: fullBody });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number, body: fullBody });
  }
}

/** Delete the marker comment if present (used when a guardrail now passes, so a
 *  stale failure comment does not linger). No-op when there is nothing to remove. */
async function deleteMarkerComment({ github, context, issueNumber, marker }) {
  const { owner, repo } = context.repo;
  const issue_number = issueNumber || context.payload.pull_request.number;
  const tag = `<!-- ${marker} -->`;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body && c.body.includes(tag));
  if (existing) {
    await github.rest.issues.deleteComment({ owner, repo, comment_id: existing.id });
  }
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

/** Short footer telling the author how to re-run the guardrails after fixing. */
const REVALIDATE_HINT = 'When fixed, press **Ready for review** to re-run the checks.';

module.exports = {
  ORG,
  TEAM_SLUG,
  ISSUE_REPO_OWNER,
  ISSUE_REPO_NAME,
  CLOSING_KEYWORDS,
  REVALIDATE_HINT,
  isDevTeamMember,
  parseIssueReferences,
  validateIssue,
  getMergeablePullRequest,
  convertToDraft,
  upsertComment,
  deleteMarkerComment,
  addLabel,
};
