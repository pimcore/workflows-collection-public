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

module.exports = { parseLine, compareLines, newestLineOnDocs, detectNewRelease };
