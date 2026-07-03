'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  loadSupportedVersions,
  lowestActiveBugfixLine,
  ltsLinesInScope,
} = require('../lib/versions');

test('loadSupportedVersions: loads default config with activeBugfixLine 2026.1', () => {
  const config = loadSupportedVersions();
  assert.equal(config.activeBugfixLine, '2026.1');
});

test('lowestActiveBugfixLine: returns 2026.1', () => {
  const config = loadSupportedVersions();
  assert.equal(lowestActiveBugfixLine(config), '2026.1');
});

test('ltsLinesInScope: at 2026-07-03 excludes lines whose support already ended', () => {
  const config = loadSupportedVersions();
  assert.deepEqual(
    ltsLinesInScope(config, new Date('2026-07-03')),
    ['2025.4', '2024.4']
  );
});

test('ltsLinesInScope: at 2024-01-01 includes all four lines', () => {
  const config = loadSupportedVersions();
  assert.deepEqual(
    ltsLinesInScope(config, new Date('2024-01-01')),
    ['2025.4', '2024.4', '2023.3', '2022.0']
  );
});
