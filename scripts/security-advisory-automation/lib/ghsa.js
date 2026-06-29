'use strict';

// GHSA IDs are "GHSA-" + three hyphen-separated groups of four base32 chars.
const _GHSA_RE = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i;

/**
 * Return the canonical GHSA ID found in text, or null.
 * Canonical form is "GHSA-" with a lowercase suffix.
 * @param {string|null|undefined} text
 * @returns {string|null}
 */
function extractGhsaId(text) {
  if (!text) return null;
  const match = _GHSA_RE.exec(text);
  if (!match) return null;
  return 'GHSA-' + match[0].slice('GHSA-'.length).toLowerCase();
}

module.exports = { extractGhsaId };
