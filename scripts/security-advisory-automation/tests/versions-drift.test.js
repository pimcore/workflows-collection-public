'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSupportedVersions } = require('../lib/versions');
const {
  parseLine,
  compareLines,
  newestLineOnDocs,
  detectNewRelease,
} = require('../lib/versions-drift');

// compareLines
test('compareLines: 2026.2 is newer than 2026.1', () => {
  assert.ok(compareLines('2026.2', '2026.1') > 0);
});

test('compareLines: 2026.1 is newer than 2025.4', () => {
  assert.ok(compareLines('2026.1', '2025.4') > 0);
});

test('compareLines: 2026.1 equals 2026.1', () => {
  assert.equal(compareLines('2026.1', '2026.1'), 0);
});

test('compareLines: throws on non version-line input', () => {
  assert.throws(() => compareLines('x', '2026.1'), Error);
});

// parseLine
test('parseLine: returns null for non version-line input', () => {
  assert.equal(parseLine('nope'), null);
});

// newestLineOnDocs
test('newestLineOnDocs: picks the newest token among several', () => {
  assert.equal(
    newestLineOnDocs('… 2024.4 … 2026.1 … 2025.4 …'),
    '2026.1'
  );
});

// detectNewRelease
test('detectNewRelease: no drift when docs newest equals configured active line', () => {
  const config = loadSupportedVersions();
  const result = detectNewRelease(config, 'page lists 2026.1 2025.4 2024.4');
  assert.equal(result.drifted, false);
});

test('detectNewRelease: drift when docs show a newer line than configured', () => {
  const config = loadSupportedVersions();
  const result = detectNewRelease(config, 'now shows 2026.2 as current');
  assert.equal(result.drifted, true);
  assert.equal(result.newest, '2026.2');
});
