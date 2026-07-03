'use strict';

/** Parse "2026.1" -> [2026, 1]; returns null if not a YYYY.N line. */
function parseLine(s) {
  const m = /^(\d{4})\.(\d+)$/.exec(String(s).trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** >0 if a is newer than b, <0 older, 0 equal. */
function compareLines(a, b) {
  const pa = parseLine(a);
  const pb = parseLine(b);
  if (!pa || !pb) throw new Error(`not a version line: ${JSON.stringify(!pa ? a : b)}`);
  return pa[0] - pb[0] || pa[1] - pb[1];
}

/** Newest YYYY.N token appearing in the fetched page text, or null. */
function newestLineOnDocs(pageText) {
  const tokens = String(pageText).match(/\b20\d\d\.\d+\b/g) || [];
  let newest = null;
  for (const t of tokens) {
    if (newest === null || compareLines(t, newest) > 0) newest = t;
  }
  return newest;
}

/** Drift = the docs page shows a line newer than config.activeBugfixLine. */
function detectNewRelease(config, pageText) {
  const newest = newestLineOnDocs(pageText);
  const drifted = newest != null && compareLines(newest, config.activeBugfixLine) > 0;
  return { newest, active: config.activeBugfixLine, drifted };
}

/**
 * Evaluate the docs page against the config and return a status the workflow
 * acts on. Distinguishes "unparseable" (no version line found — the scraper
 * likely broke) from "ok" so a broken fetch fails LOUD instead of silently
 * looking like "no drift".
 * @returns {{ status: 'ok'|'drift'|'unparseable', newest: string|null, active: string, message: string }}
 */
function evaluateDrift(config, pageText) {
  const { newest, active, drifted } = detectNewRelease(config, pageText);
  if (newest === null) {
    return {
      status: 'unparseable',
      newest,
      active,
      message:
        'Could not find any version line on the docs page — its structure may have ' +
        'changed, or the fetch failed. The drift-check needs attention (not treated as "no drift").',
    };
  }
  if (drifted) {
    return {
      status: 'drift',
      newest,
      active,
      message: `Docs page shows ${newest}, newer than configured activeBugfixLine ${active}. Update config/supported-versions.json (see the page).`,
    };
  }
  return {
    status: 'ok',
    newest,
    active,
    message: `No new release beyond configured activeBugfixLine ${active} (newest on docs: ${newest}).`,
  };
}

module.exports = { parseLine, compareLines, newestLineOnDocs, detectNewRelease, evaluateDrift };
