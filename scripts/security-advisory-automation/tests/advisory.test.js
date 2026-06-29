'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseAdvisory, requiresLtsBackport } = require('../lib/advisory');

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'advisory_sample.json');

test('parseAdvisory: extracts core fields from fixture', () => {
  const raw = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  const adv = parseAdvisory(raw);
  assert.equal(adv.ghsaId, 'GHSA-34vf-ww58-w3wc');
  assert.equal(adv.state, 'triage');
  assert.equal(adv.severity, 'critical');
  assert.ok(adv.summary.startsWith('Missing Authorization'));
});

test('parseAdvisory: keeps only composer packages (drops npm entry)', () => {
  const raw = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  const adv = parseAdvisory(raw);
  assert.deepEqual(adv.packages, ['pimcore/admin-ui-classic-bundle']);
});

test('parseAdvisory: handles empty raw object', () => {
  const adv = parseAdvisory({});
  assert.equal(adv.ghsaId, '');
  assert.deepEqual(adv.packages, []);
});

// requiresLtsBackport
test('requiresLtsBackport: critical -> true', () => {
  assert.equal(requiresLtsBackport('critical'), true);
});

test('requiresLtsBackport: high -> true', () => {
  assert.equal(requiresLtsBackport('high'), true);
});

test('requiresLtsBackport: HIGH (uppercase) -> true', () => {
  assert.equal(requiresLtsBackport('HIGH'), true);
});

test('requiresLtsBackport: moderate -> false', () => {
  assert.equal(requiresLtsBackport('moderate'), false);
});

test('requiresLtsBackport: low -> false', () => {
  assert.equal(requiresLtsBackport('low'), false);
});

test('requiresLtsBackport: empty string -> false', () => {
  assert.equal(requiresLtsBackport(''), false);
});
