'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { route } = require('../lib/routing');

function makeAdvisory({ severity = 'critical', packages = ['pimcore/admin-ui-classic-bundle'] } = {}) {
  return {
    ghsaId: 'GHSA-34vf-ww58-w3wc',
    state: 'triage',
    severity,
    summary: 'x',
    packages,
  };
}

test('route: uses identity repo (fix repo == package name)', () => {
  const [d] = route(makeAdvisory());
  assert.equal(d.fixRepo, 'pimcore/admin-ui-classic-bundle');
  assert.equal(d.dedupKey, 'GHSA-34vf-ww58-w3wc');
});

test('route: critical severity sets ltsInScope and eeRepo', () => {
  const [d] = route(makeAdvisory({ severity: 'critical' }));
  assert.equal(d.ltsInScope, true);
  assert.equal(d.eeRepo, 'pimcore/ee-admin-ui-classic-bundle');
});

test('route: low severity sets ltsInScope=false and eeRepo=null', () => {
  const [d] = route(makeAdvisory({ severity: 'low' }));
  assert.equal(d.ltsInScope, false);
  assert.equal(d.eeRepo, null);
});

test('route: produces one decision per package', () => {
  const decisions = route(makeAdvisory({ packages: ['pimcore/a', 'pimcore/b'] }));
  assert.deepEqual(decisions.map(d => d.fixRepo), ['pimcore/a', 'pimcore/b']);
});
