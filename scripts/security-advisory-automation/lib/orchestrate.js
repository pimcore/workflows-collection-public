'use strict';

const { parseAdvisory } = require('./advisory');
const { classifyAdvisory, artifactSearchQuery } = require('./triage');
const { eeRepoName, selectBranchRepo } = require('./branches');
const { loadSupportedVersions, lowestActiveBugfixLine, ltsLinesInScope } = require('./versions');
const { fetchLatestViaOctokit } = require('./source');

function splitRepo(repo) {
  const i = repo.indexOf('/');
  return { owner: repo.slice(0, i), name: repo.slice(i + 1) };
}

/** True if any open/merged issue or PR in the org already references the GHSA id. */
async function searchHandled(github, org, ghsaId) {
  const res = await github.request('GET /search/issues', { q: artifactSearchQuery(org, ghsaId) });
  return (res.data && res.data.total_count > 0) || false;
}

/** True if `branch` exists in `repo`. 404 -> false; other errors rethrow. */
async function branchExists(github, repo, branch) {
  const { owner, name } = splitRepo(repo);
  try {
    await github.request('GET /repos/{owner}/{repo}/branches/{branch}', { owner, repo: name, branch });
    return true;
  } catch (err) {
    if (err && err.status === 404) return false;
    throw err;
  }
}

/**
 * Resolve where the initial fix lands for a given line: the base repo if the
 * branch is there, else the ee-* counterpart, else null (human-fallback).
 * @returns {Promise<{repo:string, branch:string}|null>}
 */
async function resolveFixLocation(github, fixRepo, line) {
  const inBase = await branchExists(github, fixRepo, line);
  const inEe = inBase ? false : await branchExists(github, eeRepoName(fixRepo), line);
  try {
    return { repo: selectBranchRepo(fixRepo, inBase, inEe), branch: line };
  } catch {
    return null;
  }
}

/**
 * Read-only triage sweep. Returns a plan (array of entries) and logs the report.
 * @param {{ github:object, sourceRepo?:string, org?:string, limit?:number, now?:Date, log?:function, publicSafe?:boolean, config?:object }} opts
 */
async function runTriage(opts) {
  const {
    github,
    sourceRepo = 'pimcore/pimcore',
    org = splitRepo(sourceRepo).owner,
    limit = 30,
    now = new Date(),
    log = console.log,
    publicSafe = true,
    config = loadSupportedVersions(),
  } = opts;

  const raws = await fetchLatestViaOctokit(github, sourceRepo, limit);
  const line = lowestActiveBugfixLine(config);
  const entries = [];

  for (const raw of raws) {
    const advisory = parseAdvisory(raw);
    const handled = advisory.ghsaId ? await searchHandled(github, org, advisory.ghsaId) : false;
    const c = classifyAdvisory(advisory, { handled });
    const entry = {
      ghsaId: c.ghsaId, state: c.state, outcome: c.outcome,
      reason: c.reason, severity: c.severity, targets: [],
    };
    if (c.outcome === 'actionable') {
      for (const d of c.decisions) {
        const loc = await resolveFixLocation(github, d.fixRepo, line);
        entry.targets.push({
          package: d.package,
          fixRepo: d.fixRepo,
          location: loc, // {repo, branch} or null (human-fallback)
          ltsInScope: d.ltsInScope,
          ltsLines: d.ltsInScope ? ltsLinesInScope(config, now) : [],
        });
      }
    }
    entries.push(entry);
  }

  log(require('./triage-report').formatTriagePlan(entries, { publicSafe }));
  return entries;
}

module.exports = { splitRepo, searchHandled, branchExists, resolveFixLocation, runTriage };
