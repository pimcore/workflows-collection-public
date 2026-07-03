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

test('runDryRun: accepts an advisory URL and normalizes to the canonical id', async () => {
  let captured;
  const github = {
    request: async (route, params) => {
      captured = params;
      return { data: { ...triageRaw, state: 'published' } };
    },
  };
  await runDryRun({
    github,
    repo: 'pimcore/pimcore',
    ghsaId: 'https://github.com/pimcore/pimcore/security/advisories/GHSA-34vf-ww58-w3wc',
    log: () => {},
  });
  assert.equal(captured.ghsa_id, 'GHSA-34vf-ww58-w3wc');
});

test('runDryRun: an unparseable GHSA id throws a clear error', async () => {
  await assert.rejects(
    runDryRun({ github: makeFakeGithub(triageRaw), repo: 'pimcore/pimcore', ghsaId: 'not-an-id', log: () => {} }),
    /not a valid GHSA id/
  );
});

test('runDryRun: a 404 becomes a friendly not-found error', async () => {
  const github = {
    request: async () => {
      const e = new Error('Not Found');
      e.status = 404;
      throw e;
    },
  };
  await assert.rejects(
    runDryRun({ github, repo: 'pimcore/pimcore', ghsaId: 'GHSA-34vf-ww58-w3wc', log: () => {} }),
    /not found/i
  );
});

test('runDryRun: a 403 points to ADVISORY_READ_TOKEN', async () => {
  const github = {
    request: async () => {
      const e = new Error('Forbidden');
      e.status = 403;
      throw e;
    },
  };
  await assert.rejects(
    runDryRun({ github, repo: 'pimcore/pimcore', ghsaId: 'GHSA-34vf-ww58-w3wc', log: () => {} }),
    /ADVISORY_READ_TOKEN/
  );
});
