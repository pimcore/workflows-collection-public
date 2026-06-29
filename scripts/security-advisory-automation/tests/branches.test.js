'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isUnifiedEra,
  parseCompatibleLine,
  selectLowestActiveLine,
  eeRepoName,
  selectBranchRepo,
} = require('../lib/branches');

// isUnifiedEra
test('isUnifiedEra: 2026.1 is unified era', () => {
  assert.equal(isUnifiedEra('2026.1'), true);
});

test('isUnifiedEra: 2026.2 is unified era', () => {
  assert.equal(isUnifiedEra('2026.2'), true);
});

test('isUnifiedEra: 2025.4 is not unified era', () => {
  assert.equal(isUnifiedEra('2025.4'), false);
});

test('isUnifiedEra: 11.5 is not unified era', () => {
  assert.equal(isUnifiedEra('11.5'), false);
});

// parseCompatibleLine
test('parseCompatibleLine: data-hub @ 2025.4 -> 2.3', () => {
  assert.equal(parseCompatibleLine('<2.3 || >= 3'), '2.3');
});

test('parseCompatibleLine: unified era constraint', () => {
  assert.equal(parseCompatibleLine('<2026.1 || >=2026.2'), '2026.1');
});

test('parseCompatibleLine: spacing variations', () => {
  assert.equal(parseCompatibleLine('<2.3 || >=3'), '2.3');
});

test('parseCompatibleLine: throws on garbage constraint', () => {
  assert.throws(() => parseCompatibleLine('^2.3'), Error);
});

// selectLowestActiveLine
test('selectLowestActiveLine: picks lowest non-EOL line', () => {
  assert.equal(
    selectLowestActiveLine(['2026.1', '2026.2', '2025.4'], new Set(['2025.4'])),
    '2026.1'
  );
});

test('selectLowestActiveLine: throws when all lines are EOL', () => {
  assert.throws(() => selectLowestActiveLine(['2025.4'], ['2025.4']), Error);
});

test('selectLowestActiveLine: accepts array for eolLines', () => {
  assert.equal(
    selectLowestActiveLine(['2026.1', '2026.2', '2025.4'], ['2025.4']),
    '2026.1'
  );
});

test('selectLowestActiveLine: numeric order (11.0 vs 2.9 -> 2.9 is lower)', () => {
  // "2.9" < "11.0" numerically (2 < 11), "11.0" > "2.9" lexically
  assert.equal(
    selectLowestActiveLine(['11.0', '2.9'], []),
    '2.9'
  );
});

// eeRepoName
test('eeRepoName: derives ee-pimcore counterpart', () => {
  assert.equal(eeRepoName('pimcore/pimcore'), 'pimcore/ee-pimcore');
});

test('eeRepoName: derives ee-data-hub counterpart', () => {
  assert.equal(eeRepoName('pimcore/data-hub'), 'pimcore/ee-data-hub');
});

test('eeRepoName: throws without owner slash', () => {
  assert.throws(() => eeRepoName('pimcore'), Error);
});

// selectBranchRepo
test('selectBranchRepo: prefers base repo when branch present', () => {
  assert.equal(selectBranchRepo('pimcore/pimcore', true, false), 'pimcore/pimcore');
});

test('selectBranchRepo: falls back to ee-* when base absent', () => {
  assert.equal(selectBranchRepo('pimcore/pimcore', false, true), 'pimcore/ee-pimcore');
});

test('selectBranchRepo: throws when branch absent everywhere', () => {
  assert.throws(() => selectBranchRepo('pimcore/data-hub', false, false), Error);
});
