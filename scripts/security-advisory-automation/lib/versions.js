'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '..', 'config', 'supported-versions.json');

function loadSupportedVersions(configPath = DEFAULT_PATH) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/** The current release line initial fixes land on. */
function lowestActiveBugfixLine(config) {
  return config.activeBugfixLine;
}

/** LTS lines still within their support window at `now` (severity>=high backport targets). */
function ltsLinesInScope(config, now) {
  const at = now instanceof Date ? now : new Date(now);
  return (config.ltsLines || [])
    .filter((l) => new Date(l.supportUntil) >= at)
    .map((l) => l.line);
}

module.exports = { loadSupportedVersions, lowestActiveBugfixLine, ltsLinesInScope };
