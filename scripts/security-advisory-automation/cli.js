#!/usr/bin/env node
// Local read-only dry run. Usage:
//   node cli.js GHSA-xxxx-xxxx-xxxx [--repo pimcore/pimcore]
//   node cli.js --latest 5 [--repo pimcore/pimcore]
// In CI the dry run runs via the github-script workflow (octokit), not this CLI.
const { fetchAdvisoryViaGh, fetchLatestViaGh } = require('./lib/source');
const { buildReport } = require('./lib/report');
const { extractGhsaId } = require('./lib/ghsa');

function parseArgs(argv) {
  const args = { repo: 'pimcore/pimcore', ghsaId: undefined, latest: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--latest') args.latest = parseInt(argv[++i], 10);
    else if (!a.startsWith('--')) args.ghsaId = a;
  }
  return args;
}

function main(argv) {
  const { repo, ghsaId, latest } = parseArgs(argv);
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
      console.error('error: provide a GHSA id or --latest N');
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

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { parseArgs, main };
