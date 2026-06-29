'use strict';

const { extractGhsaId } = require('./ghsa');

/**
 * Parse a GitHub repository-security-advisory JSON object into an advisory object.
 * Only composer packages are kept.
 * @param {object} raw
 * @returns {{ ghsaId: string, state: string, severity: string, summary: string, packages: string[] }}
 */
function parseAdvisory(raw) {
  const ghsaId = extractGhsaId(raw.ghsa_id || '') || '';
  const vulnerabilities = raw.vulnerabilities || [];
  const packages = vulnerabilities
    .filter(v => {
      const pkg = v && v.package;
      return pkg && pkg.ecosystem === 'composer' && pkg.name;
    })
    .map(v => v.package.name);

  return {
    ghsaId,
    state: raw.state || '',
    severity: (raw.severity || '').toLowerCase(),
    summary: raw.summary || '',
    packages,
  };
}

/**
 * LTS backport is in scope only for severity >= high (high or critical).
 * @param {string} severity
 * @returns {boolean}
 */
function requiresLtsBackport(severity) {
  return ['high', 'critical'].includes(severity.toLowerCase());
}

module.exports = { parseAdvisory, requiresLtsBackport };
