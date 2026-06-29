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

test('formatReport: publicSafe + triage → redacted, no sensitive details', () => {
  const adv = makeCriticalAdvisory();
  const report = formatReport(adv, route(adv), { publicSafe: true });
  assert.ok(report.includes(BANNER));
  assert.ok(report.includes('GHSA-34vf-ww58-w3wc'));
  assert.ok(report.includes('[state: triage]'));
  assert.ok(report.includes('details suppressed'));
  assert.ok(!report.includes('IDOR in version deletion')); // no summary
  assert.ok(!report.includes('pimcore/admin-ui-classic-bundle')); // no package
  assert.ok(!report.includes('fix repo:')); // no routing detail
  assert.ok(!report.includes('LTS backport:')); // no lts detail
  assert.ok(!report.includes('ee-')); // no ee-* repo
});

test('formatReport: publicSafe + published → full report, not redacted', () => {
  const adv = {
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    state: 'published',
    severity: 'critical',
    summary: 'IDOR in version deletion',
    packages: ['pimcore/admin-ui-classic-bundle'],
  };
  const report = formatReport(adv, route(adv), { publicSafe: true });
  assert.ok(report.includes('fix repo:'));
  assert.ok(report.includes('pimcore/admin-ui-classic-bundle'));
});

test('formatReport: publicSafe false (or omitted) + triage → full report', () => {
  const adv = makeCriticalAdvisory();
  const report = formatReport(adv, route(adv), { publicSafe: false });
  assert.ok(report.includes('fix repo:'));
  assert.ok(report.includes('pimcore/admin-ui-classic-bundle'));
  const reportDefault = formatReport(adv, route(adv));
  assert.ok(reportDefault.includes('fix repo:'));
});
