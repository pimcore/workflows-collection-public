'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runDryRun } = require('../index.js');

// Fixture: a triage advisory in the raw API shape
const triageRaw = {
  ghsa_id: 'GHSA-34vf-ww58-w3wc',
  state: 'triage',
  severity: 'critical',
  summary: 'Missing Authorization on element Version mutation/deletion (IDOR)',
  vulnerabilities: [
    { package: { ecosystem: 'composer', name: 'pimcore/admin-ui-classic-bundle' } },
  ],
};

function makeFakeGithub(raw) {
  return {
    request: async () => ({ data: raw }),
  };
}

test('runDryRun: defaults publicSafe=true — triage advisory is redacted', async () => {
  const captured = [];
  await runDryRun({
    github: makeFakeGithub(triageRaw),
    repo: 'pimcore/pimcore',
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    log: (msg) => captured.push(msg),
  });
  const output = captured.join('\n');
  assert.ok(output.includes('details suppressed'), 'should contain "details suppressed"');
  assert.ok(!output.includes('pimcore/admin-ui-classic-bundle'), 'should not contain package name');
  assert.ok(!output.includes('fix repo:'), 'should not contain "fix repo:"');
  // The free-text summary and severity must never reach a public log.
  assert.ok(!output.includes('Missing Authorization'), 'should not contain the summary text');
  assert.ok(!output.includes('critical'), 'should not contain the severity');
});

test('runDryRun: missing/empty state is treated as non-published and redacted', async () => {
  const noStateRaw = { ...triageRaw, state: undefined };
  const captured = [];
  await runDryRun({
    github: makeFakeGithub(noStateRaw),
    repo: 'pimcore/pimcore',
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    log: (msg) => captured.push(msg),
  });
  const output = captured.join('\n');
  assert.ok(output.includes('details suppressed'), 'missing state must redact (fail safe)');
  assert.ok(!output.includes('Missing Authorization'), 'should not contain the summary text');
  assert.ok(!output.includes('pimcore/admin-ui-classic-bundle'), 'should not contain package name');
});

test('runDryRun: publicSafe=false — triage advisory yields full report', async () => {
  const captured = [];
  await runDryRun({
    github: makeFakeGithub(triageRaw),
    repo: 'pimcore/pimcore',
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    log: (msg) => captured.push(msg),
    publicSafe: false,
  });
  const output = captured.join('\n');
  assert.ok(output.includes('fix repo:'), 'should contain "fix repo:"');
  assert.ok(!output.includes('details suppressed'), 'should not be redacted');
});
