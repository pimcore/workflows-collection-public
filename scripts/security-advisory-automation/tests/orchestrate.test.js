'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  runTriage,
  resolveFixLocation,
  branchExists,
  searchHandled,
} = require('../lib/orchestrate');

const NOW = new Date('2026-07-03');

// Fixtures in the raw GitHub repository-security-advisory API shape.
const rawPublishedCritical = {
  ghsa_id: 'GHSA-1111-1111-1111',
  state: 'published',
  severity: 'critical',
  summary: 'Critical issue in data-hub',
  vulnerabilities: [{ package: { ecosystem: 'composer', name: 'pimcore/data-hub' } }],
};
const rawTriageHigh = {
  ghsa_id: 'GHSA-2222-2222-2222',
  state: 'triage',
  severity: 'high',
  summary: 'High issue in pimcore core, still in triage',
  vulnerabilities: [{ package: { ecosystem: 'composer', name: 'pimcore/pimcore' } }],
};
const rawClosedLowNoComposer = {
  ghsa_id: 'GHSA-3333-3333-3333',
  state: 'closed',
  severity: 'low',
  summary: 'Low severity, npm-only advisory',
  vulnerabilities: [{ package: { ecosystem: 'npm', name: 'some-js-package' } }],
};

/**
 * A fake octokit whose .request() only ever answers the three GET routes
 * runTriage uses. Every branch of this fake is a read; nothing mutates.
 */
function makeFakeGithub({ handledGhsaIds = new Set(), branchMap = {} } = {}) {
  return {
    request: async (route, params) => {
      if (route === 'GET /repos/{owner}/{repo}/security-advisories') {
        return { data: [rawPublishedCritical, rawTriageHigh, rawClosedLowNoComposer] };
      }
      if (route === 'GET /search/issues') {
        const handled = [...handledGhsaIds].some((id) => params.q.includes(id));
        return { data: { total_count: handled ? 1 : 0 } };
      }
      if (route === 'GET /repos/{owner}/{repo}/branches/{branch}') {
        const key = `${params.owner}/${params.repo}@${params.branch}`;
        if (branchMap[key]) return { data: {} };
        const err = new Error('Not Found');
        err.status = 404;
        throw err;
      }
      throw new Error(`unexpected route in fake github: ${route} ${JSON.stringify(params)}`);
    },
  };
}

describe('runTriage', () => {
  it('classifies published/triage/closed advisories and resolves branches (base + ee fallback)', async () => {
    const github = makeFakeGithub({
      branchMap: {
        'pimcore/data-hub@2026.1': true, // base has it
        // pimcore/pimcore@2026.1 absent -> falls back to ee-pimcore
        'pimcore/ee-pimcore@2026.1': true,
      },
    });

    const entries = await runTriage({
      github,
      sourceRepo: 'pimcore/pimcore',
      now: NOW,
      publicSafe: false,
      log: () => {},
    });

    assert.equal(entries.length, 3);

    const [dataHubEntry, pimcoreEntry, closedEntry] = entries;

    assert.equal(dataHubEntry.ghsaId, 'GHSA-1111-1111-1111');
    assert.equal(dataHubEntry.outcome, 'actionable');
    assert.equal(dataHubEntry.severity, 'critical');
    assert.equal(dataHubEntry.targets.length, 1);
    assert.deepEqual(dataHubEntry.targets[0].location, { repo: 'pimcore/data-hub', branch: '2026.1' });
    assert.equal(dataHubEntry.targets[0].ltsInScope, true);
    assert.ok(dataHubEntry.targets[0].ltsLines.includes('2025.4'));

    assert.equal(pimcoreEntry.ghsaId, 'GHSA-2222-2222-2222');
    assert.equal(pimcoreEntry.outcome, 'actionable');
    assert.deepEqual(pimcoreEntry.targets[0].location, { repo: 'pimcore/ee-pimcore', branch: '2026.1' });

    assert.equal(closedEntry.ghsaId, 'GHSA-3333-3333-3333');
    assert.equal(closedEntry.outcome, 'not-applicable');
    assert.equal(closedEntry.reason, 'no composer packages to route');
    assert.equal(closedEntry.targets.length, 0);
  });

  it('marks an advisory already-handled when the org search finds an existing artifact', async () => {
    const github = makeFakeGithub({
      handledGhsaIds: new Set(['GHSA-1111-1111-1111']),
      branchMap: { 'pimcore/data-hub@2026.1': true, 'pimcore/ee-pimcore@2026.1': true },
    });

    const entries = await runTriage({
      github,
      sourceRepo: 'pimcore/pimcore',
      now: NOW,
      publicSafe: false,
      log: () => {},
    });

    const dataHubEntry = entries.find((e) => e.ghsaId === 'GHSA-1111-1111-1111');
    assert.equal(dataHubEntry.outcome, 'already-handled');
    assert.match(dataHubEntry.reason, /already references/);
  });

  it('only ever issues GET requests', async () => {
    const methods = new Set();
    const github = {
      request: async (route, params) => {
        methods.add(route.split(' ')[0]);
        if (route === 'GET /repos/{owner}/{repo}/security-advisories') {
          return { data: [rawPublishedCritical] };
        }
        if (route === 'GET /search/issues') return { data: { total_count: 0 } };
        if (route === 'GET /repos/{owner}/{repo}/branches/{branch}') return { data: {} };
        throw new Error(`unexpected route ${route}`);
      },
    };
    await runTriage({ github, sourceRepo: 'pimcore/pimcore', now: NOW, log: () => {} });
    assert.deepEqual([...methods], ['GET']);
  });
});

describe('searchHandled', () => {
  it('maps total_count > 0 to handled=true', async () => {
    const github = { request: async () => ({ data: { total_count: 2 } }) };
    assert.equal(await searchHandled(github, 'pimcore', 'GHSA-xxxx-xxxx-xxxx'), true);
  });

  it('maps total_count === 0 to handled=false', async () => {
    const github = { request: async () => ({ data: { total_count: 0 } }) };
    assert.equal(await searchHandled(github, 'pimcore', 'GHSA-xxxx-xxxx-xxxx'), false);
  });
});

describe('branchExists', () => {
  it('resolves true when the branch is found', async () => {
    const github = { request: async () => ({ data: {} }) };
    assert.equal(await branchExists(github, 'pimcore/pimcore', '2026.1'), true);
  });

  it('resolves false on a 404', async () => {
    const github = {
      request: async () => {
        const err = new Error('Not Found');
        err.status = 404;
        throw err;
      },
    };
    assert.equal(await branchExists(github, 'pimcore/pimcore', '2026.1'), false);
  });

  it('rethrows non-404 errors', async () => {
    const github = {
      request: async () => {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
      },
    };
    await assert.rejects(branchExists(github, 'pimcore/pimcore', '2026.1'), /Forbidden/);
  });
});

describe('resolveFixLocation', () => {
  it('returns the base repo when the branch exists there', async () => {
    const github = { request: async () => ({ data: {} }) };
    const loc = await resolveFixLocation(github, 'pimcore/pimcore', '2026.1');
    assert.deepEqual(loc, { repo: 'pimcore/pimcore', branch: '2026.1' });
  });

  it('falls back to the ee-* repo when only it has the branch', async () => {
    const github = {
      request: async (route, params) => {
        if (params.repo === 'pimcore') {
          const err = new Error('Not Found');
          err.status = 404;
          throw err;
        }
        return { data: {} }; // ee-pimcore has it
      },
    };
    const loc = await resolveFixLocation(github, 'pimcore/pimcore', '2026.1');
    assert.deepEqual(loc, { repo: 'pimcore/ee-pimcore', branch: '2026.1' });
  });

  it('returns null (human-fallback) when neither base nor ee has the branch', async () => {
    const github = {
      request: async () => {
        const err = new Error('Not Found');
        err.status = 404;
        throw err;
      },
    };
    const loc = await resolveFixLocation(github, 'pimcore/pimcore', '2026.1');
    assert.equal(loc, null);
  });
});
