'use strict';

// Re-export the full public API.
const { extractGhsaId } = require('./lib/ghsa');
const {
  isUnifiedEra,
  parseCompatibleLine,
  selectLowestActiveLine,
  eeRepoName,
  selectBranchRepo,
} = require('./lib/branches');
const { parseAdvisory, requiresLtsBackport } = require('./lib/advisory');
const { route } = require('./lib/routing');
const { BANNER, formatReport, buildReport } = require('./lib/report');
const {
  advisoryApiPath,
  latestApiPath,
  fetchAdvisoryViaGh,
  fetchLatestViaGh,
  fetchAdvisoryViaOctokit,
  fetchLatestViaOctokit,
} = require('./lib/source');

/**
 * Dry-run: fetch advisory/advisories and log the routing report.
 * `ghsaId` may be a bare GHSA id or a full advisory URL — it is normalized to
 * the canonical id. Fetch failures are surfaced as clear, actionable messages.
 * @param {{ github: object, repo: string, ghsaId?: string, latest?: number, log?: function, publicSafe?: boolean }} opts
 */
async function runDryRun({ github, repo, ghsaId, latest, log = console.log, publicSafe = true }) {
  const id = ghsaId ? extractGhsaId(ghsaId) : undefined;
  if (!latest && !id) {
    throw new Error(
      ghsaId
        ? `not a valid GHSA id: ${JSON.stringify(ghsaId)} (expected e.g. GHSA-xxxx-xxxx-xxxx, or an advisory URL)`
        : 'provide a GHSA id or a positive "latest" count'
    );
  }

  let raws;
  try {
    raws = latest
      ? await fetchLatestViaOctokit(github, repo, latest)
      : [await fetchAdvisoryViaOctokit(github, repo, id)];
  } catch (err) {
    const status = err && err.status;
    if (status === 404) {
      throw new Error(`Advisory ${id} not found in ${repo}. Check the GHSA id and the repo.`);
    }
    if (status === 401 || status === 403) {
      throw new Error(
        `Access denied reading advisories on ${repo}. The token likely lacks ` +
        `security-advisory read access — add an ADVISORY_READ_TOKEN secret ` +
        `(a PAT with that scope). See the README.`
      );
    }
    throw err;
  }

  log(raws.map((raw) => buildReport(raw, { publicSafe })).join('\n\n'));
}

module.exports = {
  // ghsa
  extractGhsaId,
  // branches
  isUnifiedEra,
  parseCompatibleLine,
  selectLowestActiveLine,
  eeRepoName,
  selectBranchRepo,
  // advisory
  parseAdvisory,
  requiresLtsBackport,
  // routing
  route,
  // report
  BANNER,
  formatReport,
  buildReport,
  // source
  advisoryApiPath,
  latestApiPath,
  fetchAdvisoryViaGh,
  fetchLatestViaGh,
  fetchAdvisoryViaOctokit,
  fetchLatestViaOctokit,
  // orchestration
  runDryRun,
};
