'use strict';

const { route } = require('./routing');

/**
 * Classify one parsed advisory into a triage outcome for Workflow 1.
 *
 * Pure function: the dedup verdict is supplied as `opts.handled` (computed by an
 * org-wide artifact search — see `artifactSearchQuery`), so this stays testable
 * and side-effect-free. It decides *what* should happen; creating the ticket and
 * dispatching the coding agent is the (write) orchestration layer, not here.
 *
 * @param {{ ghsaId: string, state: string, severity: string, summary: string, packages: string[] }} advisory
 * @param {{ handled?: boolean }} [opts]
 * @returns {{ ghsaId: string, state: string, outcome: 'already-handled'|'not-applicable'|'actionable', reason?: string, severity?: string, decisions?: object[] }}
 */
function classifyAdvisory(advisory, opts = {}) {
  const base = { ghsaId: advisory.ghsaId, state: advisory.state };

  // Idempotency: an existing open/merged artifact referencing this GHSA id means
  // it's already ticketed or being handled manually — skip. Takes precedence.
  if (opts.handled === true) {
    return {
      ...base,
      outcome: 'already-handled',
      reason: 'an open/merged issue or PR already references this advisory',
    };
  }

  const decisions = route(advisory); // one routing decision per composer package
  if (decisions.length === 0) {
    return { ...base, outcome: 'not-applicable', reason: 'no composer packages to route' };
  }

  return { ...base, outcome: 'actionable', severity: advisory.severity, decisions };
}

/**
 * Org-wide search query to find any issue/PR that already references an advisory.
 * The GHSA id is the dedup key and the human-readable traceability link, so a
 * single query covers both auto-created tickets and manual takeovers. Read-only.
 *
 * @param {string} org
 * @param {string} ghsaId
 * @returns {string}
 */
function artifactSearchQuery(org, ghsaId) {
  return `org:${org} ${ghsaId} in:title,body`;
}

module.exports = { classifyAdvisory, artifactSearchQuery };
