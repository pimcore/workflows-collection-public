#!/usr/bin/env node
// Local read-only dry run. Usage:
//   node cli.js GHSA-xxxx-xxxx-xxxx [--repo pimcore/pimcore]
//   node cli.js --latest 5 [--repo pimcore/pimcore]
//   node cli.js --triage [--repo pimcore/pimcore] [--limit N]
// In CI the dry run runs via the github-script workflow (octokit), not this CLI.
const { execFileSync } = require('child_process');
const { fetchAdvisoryViaGh, fetchLatestViaGh } = require('./lib/source');
const { buildReport } = require('./lib/report');
const { extractGhsaId } = require('./lib/ghsa');
const { runTriage } = require('./lib/orchestrate');

function parseArgs(argv) {
  const args = {
    repo: 'pimcore/pimcore',
    ghsaId: undefined,
    latest: undefined,
    triage: false,
    limit: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--latest') args.latest = parseInt(argv[++i], 10);
    else if (a === '--triage') args.triage = true;
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (!a.startsWith('--')) args.ghsaId = a;
  }
  return args;
}

/**
 * Build the `gh api` path (+ query string) for an octokit-style
 * `request(route, params)` call. Path params (`{owner}`) are substituted;
 * any remaining params become the query string. Read-only: GET only.
 * @param {string} route - e.g. "GET /repos/{owner}/{repo}/branches/{branch}"
 * @param {object} params
 * @returns {string}
 */
function buildGhPath(route, params = {}) {
  const [method, template] = route.split(' ');
  if (method !== 'GET') {
    throw new Error(`ghShim is read-only; refusing non-GET route: ${route}`);
  }
  const used = new Set();
  let path = template.replace(/\{(\w+)\}/g, (_, key) => {
    used.add(key);
    if (!(key in params)) throw new Error(`missing param "${key}" for route ${route}`);
    return encodeURIComponent(params[key]);
  });
  const queryKeys = Object.keys(params).filter((k) => !used.has(k));
  if (queryKeys.length) {
    const qs = queryKeys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    path += (path.includes('?') ? '&' : '?') + qs;
  }
  return path.replace(/^\//, '');
}

/**
 * Tiny octokit-shim over `gh api` so `runTriage` (written against
 * `github.request`) also works locally without octokit. Read-only: every
 * call is a GET; nothing here can mutate GitHub state.
 * @returns {{ request: (route:string, params?:object) => Promise<{data:any}> }}
 */
function makeGhShim() {
  return {
    async request(route, params = {}) {
      const path = buildGhPath(route, params);
      try {
        const output = execFileSync('gh', ['api', path], { encoding: 'utf8' });
        return { data: JSON.parse(output) };
      } catch (err) {
        const stderr = String((err && err.stderr) || (err && err.message) || '');
        const match = /HTTP (\d+)/.exec(stderr);
        const wrapped = new Error(stderr || 'gh api failed');
        if (match) wrapped.status = parseInt(match[1], 10);
        throw wrapped;
      }
    },
  };
}

async function main(argv) {
  const { repo, ghsaId, latest, triage, limit } = parseArgs(argv);

  if (triage) {
    try {
      await runTriage({
        github: makeGhShim(),
        sourceRepo: repo,
        limit: limit || 30,
        publicSafe: false, // local CLI: full detail
        log: console.log,
      });
      return 0;
    } catch (err) {
      console.error(
        `error: could not run triage on ${repo}. Check that \`gh\` is authenticated with advisory read access.`
      );
      console.error(String((err && err.message) || err).split('\n')[0]);
      return 1;
    }
  }

  let raws;
  try {
    if (latest) {
      raws = fetchLatestViaGh(repo, latest);
    } else if (ghsaId) {
      const id = extractGhsaId(ghsaId); // accepts a bare id or an advisory URL
      if (!id) {
        console.error(`error: not a valid GHSA id: ${ghsaId} (expected GHSA-xxxx-xxxx-xxxx or an advisory URL)`);
        return 2;
      }
      raws = [fetchAdvisoryViaGh(repo, id)];
    } else {
      console.error('error: provide a GHSA id, --latest N, or --triage');
      return 2;
    }
  } catch (err) {
    console.error(
      `error: could not fetch from ${repo}. Check the id/repo and that \`gh\` is authenticated with advisory read access.`
    );
    console.error(String((err && err.message) || err).split('\n')[0]);
    return 1;
  }
  console.log(raws.map(buildReport).join('\n\n'));
  return 0;
}

if (require.main === module) {
  Promise.resolve(main(process.argv.slice(2))).then((code) => process.exit(code));
}
module.exports = { parseArgs, main, buildGhPath, makeGhShim };
