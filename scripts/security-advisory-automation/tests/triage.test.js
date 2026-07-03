'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyAdvisory, artifactSearchQuery } = require('../lib/triage');

function adv(over = {}) {
  return {
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    state: 'triage',
    severity: 'critical',
    summary: 'x',
    packages: ['pimcore/admin-ui-classic-bundle'],
    ...over,
  };
}

test('classifyAdvisory: handled → already-handled (skip)', () => {
  const r = classifyAdvisory(adv(), { handled: true });
  assert.equal(r.outcome, 'already-handled');
  assert.equal(r.ghsaId, 'GHSA-34vf-ww58-w3wc');
  assert.ok(!r.decisions, 'no routing decisions when skipped');
});

test('classifyAdvisory: no composer packages → not-applicable', () => {
  const r = classifyAdvisory(adv({ packages: [] }));
  assert.equal(r.outcome, 'not-applicable');
});

test('classifyAdvisory: composer package → actionable with routing decisions', () => {
  const r = classifyAdvisory(adv());
  assert.equal(r.outcome, 'actionable');
  assert.equal(r.severity, 'critical');
  assert.equal(r.decisions.length, 1);
  assert.equal(r.decisions[0].fixRepo, 'pimcore/admin-ui-classic-bundle');
  assert.equal(r.decisions[0].eeRepo, 'pimcore/ee-admin-ui-classic-bundle');
});

test('classifyAdvisory: handled takes precedence over routing', () => {
  const r = classifyAdvisory(adv({ packages: ['pimcore/data-hub'] }), { handled: true });
  assert.equal(r.outcome, 'already-handled');
});

test('classifyAdvisory: carries advisory state through', () => {
  assert.equal(classifyAdvisory(adv({ state: 'published' })).state, 'published');
});

test('artifactSearchQuery: org-scoped GHSA-id search over title+body', () => {
  assert.equal(
    artifactSearchQuery('pimcore', 'GHSA-34vf-ww58-w3wc'),
    'org:pimcore GHSA-34vf-ww58-w3wc in:title,body'
  );
});
