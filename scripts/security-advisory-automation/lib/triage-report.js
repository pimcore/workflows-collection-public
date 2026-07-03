'use strict';

const BANNER = 'TRIAGE PLAN (read-only) — no tickets, PRs, or writes performed.';

/** Render one triage entry; redact non-published advisories when publicSafe. */
function formatEntry(e, publicSafe) {
  if (publicSafe && e.state !== 'published') {
    return `- ${e.ghsaId} [${e.state}] — ${e.outcome}; details suppressed on public runner (non-published). Use the local CLI.`;
  }
  if (e.outcome === 'already-handled') return `- ${e.ghsaId} [${e.state}] — already handled (${e.reason})`;
  if (e.outcome === 'not-applicable') return `- ${e.ghsaId} [${e.state}] — not applicable (${e.reason})`;
  // actionable
  const lines = [`- ${e.ghsaId} [${e.state}, severity: ${e.severity}] — ACTIONABLE`];
  for (const t of e.targets) {
    const where = t.location
      ? `${t.location.repo}@${t.location.branch}`
      : 'HUMAN-FALLBACK (target branch not found in base or ee-* repo)';
    const lts = t.ltsInScope
      ? (t.ltsLines.length ? `LTS backport → ${t.ltsLines.join(', ')}` : 'LTS backport in scope (no active LTS lines)')
      : 'no LTS backport (severity < high)';
    lines.push(`    ${t.package} → fix on ${where}; ${lts}`);
  }
  return lines.join('\n');
}

function formatTriagePlan(entries, opts = {}) {
  const publicSafe = opts.publicSafe === true;
  const body = entries.length
    ? entries.map((e) => formatEntry(e, publicSafe)).join('\n')
    : '(no advisories)';
  return `${BANNER}\n${body}`;
}

module.exports = { BANNER, formatEntry, formatTriagePlan };
