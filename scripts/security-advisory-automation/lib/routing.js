'use strict';

const { requiresLtsBackport } = require('./advisory');
const { eeRepoName } = require('./branches');

/**
 * Map an advisory to one routing decision per affected composer package.
 * Fix repo = the package's repo by the Pimcore identity convention.
 * @param {{ ghsaId: string, severity: string, packages: string[] }} advisory
 * @returns {{ package: string, fixRepo: string, dedupKey: string, ltsInScope: boolean, eeRepo: string|null }[]}
 */
function route(advisory) {
  const lts = requiresLtsBackport(advisory.severity);
  return advisory.packages.map(pkg => ({
    package: pkg,
    fixRepo: pkg,
    dedupKey: advisory.ghsaId,
    ltsInScope: lts,
    eeRepo: lts ? eeRepoName(pkg) : null,
  }));
}

module.exports = { route };
