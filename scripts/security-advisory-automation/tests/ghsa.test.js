'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractGhsaId } = require('../lib/ghsa');

test('extractGhsaId: extracts from URL', () => {
  assert.equal(
    extractGhsaId('https://github.com/pimcore/pimcore/security/advisories/GHSA-8mjv-1234-abcd'),
    'GHSA-8mjv-1234-abcd'
  );
});

test('extractGhsaId: normalises uppercase to canonical lowercase suffix', () => {
  assert.equal(
    extractGhsaId('Security-Advisory: GHSA-AAAA-BBBB-CCCC'),
    'GHSA-aaaa-bbbb-cccc'
  );
});

test('extractGhsaId: accepts lowercase prefix', () => {
  assert.equal(
    extractGhsaId('see ghsa-8mjv-1234-abcd for details'),
    'GHSA-8mjv-1234-abcd'
  );
});

test('extractGhsaId: returns null when no advisory present', () => {
  assert.equal(extractGhsaId('no advisory here'), null);
});

test('extractGhsaId: returns null for empty string', () => {
  assert.equal(extractGhsaId(''), null);
});

test('extractGhsaId: returns null for null', () => {
  assert.equal(extractGhsaId(null), null);
});
