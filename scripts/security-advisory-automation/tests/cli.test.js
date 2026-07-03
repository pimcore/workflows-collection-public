'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, buildGhPath } = require('../cli');

describe('parseArgs', () => {
  it('positional ghsa id', () => {
    const r = parseArgs(['GHSA-1234-5678-abcd']);
    assert.equal(r.ghsaId, 'GHSA-1234-5678-abcd');
    assert.equal(r.latest, undefined);
    assert.equal(r.repo, 'pimcore/pimcore');
    assert.equal(r.triage, false);
  });

  it('--repo overrides default', () => {
    const r = parseArgs(['GHSA-1234-5678-abcd', '--repo', 'pimcore/other']);
    assert.equal(r.repo, 'pimcore/other');
    assert.equal(r.ghsaId, 'GHSA-1234-5678-abcd');
  });

  it('--latest is parsed as integer', () => {
    const r = parseArgs(['--latest', '5']);
    assert.equal(r.latest, 5);
    assert.strictEqual(typeof r.latest, 'number');
    assert.equal(r.ghsaId, undefined);
  });

  it('default repo is pimcore/pimcore', () => {
    const r = parseArgs([]);
    assert.equal(r.repo, 'pimcore/pimcore');
  });

  it('--repo before --latest', () => {
    const r = parseArgs(['--repo', 'pimcore/foo', '--latest', '3']);
    assert.equal(r.repo, 'pimcore/foo');
    assert.equal(r.latest, 3);
    assert.equal(r.ghsaId, undefined);
  });

  it('--triage sets the triage flag', () => {
    const r = parseArgs(['--triage']);
    assert.equal(r.triage, true);
    assert.equal(r.ghsaId, undefined);
    assert.equal(r.latest, undefined);
  });

  it('--triage with --repo and --limit', () => {
    const r = parseArgs(['--triage', '--repo', 'pimcore/data-hub', '--limit', '10']);
    assert.equal(r.triage, true);
    assert.equal(r.repo, 'pimcore/data-hub');
    assert.equal(r.limit, 10);
    assert.strictEqual(typeof r.limit, 'number');
  });
});

describe('buildGhPath', () => {
  it('substitutes path params and leaves no query string when none remain', () => {
    const path = buildGhPath('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner: 'pimcore',
      repo: 'pimcore',
      branch: '2026.1',
    });
    assert.equal(path, 'repos/pimcore/pimcore/branches/2026.1');
  });

  it('turns leftover params into a query string', () => {
    const path = buildGhPath('GET /repos/{owner}/{repo}/security-advisories', {
      owner: 'pimcore',
      repo: 'pimcore',
      per_page: 30,
    });
    assert.equal(path, 'repos/pimcore/pimcore/security-advisories?per_page=30');
  });

  it('URL-encodes query param values', () => {
    const path = buildGhPath('GET /search/issues', { q: 'org:pimcore GHSA-xxxx in:title,body' });
    assert.equal(path, 'search/issues?q=org%3Apimcore%20GHSA-xxxx%20in%3Atitle%2Cbody');
  });

  it('rejects non-GET routes (read-only shim)', () => {
    assert.throws(() => buildGhPath('POST /repos/{owner}/{repo}/issues', { owner: 'a', repo: 'b' }), /read-only/);
  });

  it('throws when a required path param is missing', () => {
    assert.throws(() => buildGhPath('GET /repos/{owner}/{repo}/branches/{branch}', { owner: 'a', repo: 'b' }), /missing param/);
  });
});
