'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../cli');

describe('parseArgs', () => {
  it('positional ghsa id', () => {
    const r = parseArgs(['GHSA-1234-5678-abcd']);
    assert.equal(r.ghsaId, 'GHSA-1234-5678-abcd');
    assert.equal(r.latest, undefined);
    assert.equal(r.repo, 'pimcore/pimcore');
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
});
