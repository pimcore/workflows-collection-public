'use strict';

const { parseAdvisory } = require('./advisory');
const { route } = require('./routing');

const BANNER = 'DRY RUN — no tickets, PRs, or writes performed.';

/**
 * Render the routing decision for one advisory as human-readable text.
 * @param {{ ghsaId: string, state: string, severity: string, summary: string, packages: string[] }} advisory
 * @param {{ package: string, fixRepo: string, dedupKey: string, ltsInScope: boolean, eeRepo: string|null }[]} decisions
 * @returns {string}
 */
function formatReport(advisory, decisions) {
  const lines = [
    BANNER,
    `Advisory ${advisory.ghsaId}  [state: ${advisory.state}, severity: ${advisory.severity}]`,
    `  summary: ${advisory.summary}`,
  ];

  if (!decisions || decisions.length === 0) {
    lines.push(
      '  affects: (no composer packages found) → HUMAN-FALLBACK: cannot route automatically'
    );
    return lines.join('\n');
  }

  lines.push('  affects: ' + decisions.map(d => d.package).join(', '));

  for (const d of decisions) {
    let lts;
    if (d.ltsInScope) {
      lts = `YES (severity >= high) → ee-* repo ${d.eeRepo} (if branch absent from base)`;
    } else {
      lts = 'no (severity < high)';
    }
    lines.push(
      `  → ${d.package}`,
      `      fix repo:     ${d.fixRepo}   (package→repo)`,
      `      dedup key:    ${d.dedupKey}`,
      `      LTS backport: ${lts}`,
      '      WOULD: create tracking issue + assign Copilot   (NOT executed)'
    );
  }

  return lines.join('\n');
}

/**
 * Parse a raw advisory JSON and build its report string.
 * @param {object} rawAdvisory
 * @returns {string}
 */
function buildReport(rawAdvisory) {
  const advisory = parseAdvisory(rawAdvisory);
  return formatReport(advisory, route(advisory));
}

module.exports = { BANNER, formatReport, buildReport };
