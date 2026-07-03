'use strict';

const { parseAdvisory } = require('./advisory');
const { route } = require('./routing');

const BANNER = 'DRY RUN — no tickets, PRs, or writes performed.';

/**
 * Advisory text is untrusted data. Replace control characters (newlines, tabs,
 * ANSI escapes, etc.) with spaces and collapse runs, so a crafted summary
 * cannot forge extra report lines or inject terminal escapes into the (public)
 * log. Uses char-code checks rather than an embedded control-char regex so the
 * source stays readable and copy-safe.
 * @param {string} s
 * @returns {string}
 */
function sanitizeText(s) {
  let out = '';
  for (const ch of String(s)) {
    const code = ch.charCodeAt(0);
    out += code < 0x20 || code === 0x7f ? ' ' : ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Render the routing decision for one advisory as human-readable text.
 * @param {{ ghsaId: string, state: string, severity: string, summary: string, packages: string[] }} advisory
 * @param {{ package: string, fixRepo: string, dedupKey: string, ltsInScope: boolean, eeRepo: string|null }[]} decisions
 * @param {{ publicSafe?: boolean }} [opts]
 * @returns {string}
 */
function formatReport(advisory, decisions, opts = {}) {
  const publicSafe = opts.publicSafe === true;
  if (publicSafe && advisory.state !== 'published') {
    return (
      `${BANNER}\n` +
      `Advisory ${advisory.ghsaId}  [state: ${advisory.state}] — routing computed; ` +
      `details suppressed on public runner (non-published advisory). ` +
      `Use the local CLI for full detail.`
    );
  }
  const lines = [
    BANNER,
    `Advisory ${advisory.ghsaId}  [state: ${advisory.state}, severity: ${advisory.severity}]`,
    `  summary: ${sanitizeText(advisory.summary)}`,
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
      `      fix repo:     ${d.fixRepo}   (identity)`,
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
 * @param {{ publicSafe?: boolean }} [opts]
 * @returns {string}
 */
function buildReport(rawAdvisory, opts = {}) {
  const advisory = parseAdvisory(rawAdvisory);
  return formatReport(advisory, route(advisory), opts);
}

module.exports = { BANNER, formatReport, buildReport };
