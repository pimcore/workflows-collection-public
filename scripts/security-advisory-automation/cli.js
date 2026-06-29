#!/usr/bin/env node
// Local read-only dry run. Usage:
//   node cli.js GHSA-xxxx-xxxx-xxxx [--repo pimcore/pimcore]
//   node cli.js --latest 5 [--repo pimcore/pimcore]
// In CI the dry run runs via the github-script workflow (octokit), not this CLI.
const { fetchAdvisoryViaGh, fetchLatestViaGh } = require('./lib/source');
const { buildReport } = require('./lib/report');

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
  if (latest) raws = fetchLatestViaGh(repo, latest);
  else if (ghsaId) raws = [fetchAdvisoryViaGh(repo, ghsaId)];
  else {
    console.error('error: provide a GHSA id or --latest N');
    return 2;
  }
  console.log(raws.map(buildReport).join('\n\n'));
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { parseArgs, main };
