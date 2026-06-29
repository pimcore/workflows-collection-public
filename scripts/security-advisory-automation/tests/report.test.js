'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BANNER, formatReport } = require('../lib/report');
const { route } = require('../lib/routing');

function makeCriticalAdvisory() {
  return {
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    state: 'triage',
    severity: 'critical',
    summary: 'IDOR in version deletion',
    packages: ['pimcore/admin-ui-classic-bundle'],
  };
}

test('formatReport: includes BANNER and routing info for critical advisory', () => {
  const adv = makeCriticalAdvisory();
  const report = formatReport(adv, route(adv));
  assert.ok(report.includes(BANNER));
  assert.ok(report.includes('GHSA-34vf-ww58-w3wc'));
  assert.ok(report.includes('fix repo:     pimcore/admin-ui-classic-bundle'));
  assert.ok(report.includes('pimcore/ee-admin-ui-classic-bundle')); // ee-* for critical
  assert.ok(report.includes('NOT executed'));
});

test('formatReport: low severity shows no-lts line', () => {
  const adv = {
    ghsaId: 'GHSA-aaaa-bbbb-cccc',
    state: 'published',
    severity: 'low',
    summary: 'minor',
    packages: ['pimcore/data-hub'],
  };
  const report = formatReport(adv, route(adv));
  assert.ok(report.includes('no (severity < high)'));
});

test('formatReport: no packages produces HUMAN-FALLBACK line', () => {
  const adv = {
    ghsaId: 'GHSA-aaaa-bbbb-cccc',
    state: 'triage',
    severity: 'high',
    summary: 'x',
    packages: [],
  };
  const report = formatReport(adv, route(adv));
  assert.ok(report.includes('HUMAN-FALLBACK'));
});
