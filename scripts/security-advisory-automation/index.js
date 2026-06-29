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
 * @param {{ github: object, repo: string, ghsaId?: string, latest?: number, log?: function }} opts
 */
async function runDryRun({ github, repo, ghsaId, latest, log = console.log }) {
  const { fetchAdvisoryViaOctokit, fetchLatestViaOctokit } = require('./lib/source');
  const { buildReport } = require('./lib/report');
  const raws = latest
    ? await fetchLatestViaOctokit(github, repo, latest)
    : [await fetchAdvisoryViaOctokit(github, repo, ghsaId)];
  log(raws.map(buildReport).join('\n\n'));
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
