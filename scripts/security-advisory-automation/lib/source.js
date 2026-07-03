'use strict';

const { execFileSync } = require('child_process');

/**
 * Path for fetching a single advisory.
 * @param {string} repo
 * @param {string} ghsaId
 * @returns {string}
 */
function advisoryApiPath(repo, ghsaId) {
  return `repos/${repo}/security-advisories/${ghsaId}`;
}

/**
 * Path for fetching the latest advisories.
 * @param {string} repo
 * @param {number} limit
 * @returns {string}
 */
function latestApiPath(repo, limit) {
  return `repos/${repo}/security-advisories?per_page=${Number(limit) || 5}`;
}

/**
 * Fetch one advisory via `gh api`. Read-only.
 * @param {string} repo
 * @param {string} ghsaId
 * @returns {object}
 */
function fetchAdvisoryViaGh(repo, ghsaId) {
  const path = advisoryApiPath(repo, ghsaId);
  const output = execFileSync('gh', ['api', path], { encoding: 'utf8' });
  return JSON.parse(output);
}

/**
 * Fetch the most recent advisories via `gh api`. Read-only.
 * @param {string} repo
 * @param {number} limit
 * @returns {object[]}
 */
function fetchLatestViaGh(repo, limit) {
  const path = latestApiPath(repo, limit);
  const output = execFileSync('gh', ['api', path], { encoding: 'utf8' });
  const data = JSON.parse(output);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch one advisory via Octokit github.request.
 * @param {object} github - Octokit instance with .request()
 * @param {string} repo - "owner/name"
 * @param {string} ghsaId
 * @returns {Promise<object>}
 */
async function fetchAdvisoryViaOctokit(github, repo, ghsaId) {
  const slash = repo.indexOf('/');
  const owner = repo.slice(0, slash);
  const name = repo.slice(slash + 1);
  const response = await github.request(
    'GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}',
    { owner, repo: name, ghsa_id: ghsaId }
  );
  return response.data;
}

/**
 * Fetch the most recent advisories via Octokit github.request.
 * @param {object} github - Octokit instance with .request()
 * @param {string} repo - "owner/name"
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function fetchLatestViaOctokit(github, repo, limit) {
  const slash = repo.indexOf('/');
  const owner = repo.slice(0, slash);
  const name = repo.slice(slash + 1);
  const response = await github.request(
    'GET /repos/{owner}/{repo}/security-advisories',
    { owner, repo: name, per_page: Number(limit) || 5 }
  );
  return Array.isArray(response.data) ? response.data : [];
}

module.exports = {
  advisoryApiPath,
  latestApiPath,
  fetchAdvisoryViaGh,
  fetchLatestViaGh,
  fetchAdvisoryViaOctokit,
  fetchLatestViaOctokit,
};
