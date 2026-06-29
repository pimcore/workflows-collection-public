'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { advisoryApiPath, latestApiPath, fetchAdvisoryViaOctokit, fetchLatestViaOctokit } = require('../lib/source');

// Pure path helpers
test('advisoryApiPath: returns correct path', () => {
  assert.equal(
    advisoryApiPath('pimcore/pimcore', 'GHSA-x'),
    'repos/pimcore/pimcore/security-advisories/GHSA-x'
  );
});

test('latestApiPath: returns correct path with per_page', () => {
  assert.equal(
    latestApiPath('pimcore/pimcore', 5),
    'repos/pimcore/pimcore/security-advisories?per_page=5'
  );
});

// fetchAdvisoryViaOctokit
test('fetchAdvisoryViaOctokit: calls correct route with right params and returns data', async () => {
  const calls = [];
  const fakeGithub = {
    request: async (route, params) => {
      calls.push({ route, params });
      return { data: { ghsa_id: 'GHSA-x' } };
    },
  };

  const result = await fetchAdvisoryViaOctokit(fakeGithub, 'pimcore/pimcore', 'GHSA-x');
  assert.deepEqual(result, { ghsa_id: 'GHSA-x' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].route, 'GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}');
  assert.equal(calls[0].params.owner, 'pimcore');
  assert.equal(calls[0].params.repo, 'pimcore');
  assert.equal(calls[0].params.ghsa_id, 'GHSA-x');
});

// fetchLatestViaOctokit
test('fetchLatestViaOctokit: calls correct route and returns array data', async () => {
  const calls = [];
  const fakeGithub = {
    request: async (route, params) => {
      calls.push({ route, params });
      return { data: [{ ghsa_id: 'GHSA-a' }, { ghsa_id: 'GHSA-b' }] };
    },
  };

  const result = await fetchLatestViaOctokit(fakeGithub, 'pimcore/pimcore', 2);
  assert.deepEqual(result, [{ ghsa_id: 'GHSA-a' }, { ghsa_id: 'GHSA-b' }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].route, 'GET /repos/{owner}/{repo}/security-advisories');
  assert.equal(calls[0].params.owner, 'pimcore');
  assert.equal(calls[0].params.repo, 'pimcore');
  assert.equal(calls[0].params.per_page, 2);
});

test('fetchLatestViaOctokit: non-array data returns empty array', async () => {
  const fakeGithub = {
    request: async () => ({ data: { message: 'err' } }),
  };
  const result = await fetchLatestViaOctokit(fakeGithub, 'pimcore/pimcore', 2);
  assert.deepEqual(result, []);
});
