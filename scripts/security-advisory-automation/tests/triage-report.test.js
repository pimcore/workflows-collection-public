'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { BANNER, formatTriagePlan } = require('../lib/triage-report');

const actionablePublished = {
  ghsaId: 'GHSA-1111-1111-1111',
  state: 'published',
  outcome: 'actionable',
  severity: 'critical',
  targets: [
    {
      package: 'pimcore/data-hub',
      fixRepo: 'pimcore/data-hub',
      location: { repo: 'pimcore/data-hub', branch: '2026.1' },
      ltsInScope: true,
      ltsLines: ['2025.4', '2024.4'],
    },
  ],
};

const actionableTriage = {
  ghsaId: 'GHSA-2222-2222-2222',
  state: 'triage',
  outcome: 'actionable',
  severity: 'high',
  targets: [
    {
      package: 'pimcore/pimcore',
      fixRepo: 'pimcore/pimcore',
      location: { repo: 'pimcore/ee-pimcore', branch: '2026.1' },
      ltsInScope: true,
      ltsLines: ['2025.4'],
    },
  ],
};

const notApplicable = {
  ghsaId: 'GHSA-3333-3333-3333',
  state: 'closed',
  outcome: 'not-applicable',
  reason: 'no composer packages to route',
  targets: [],
};

const alreadyHandled = {
  ghsaId: 'GHSA-4444-4444-4444',
  state: 'published',
  outcome: 'already-handled',
  reason: 'an open/merged issue or PR already references this advisory',
  targets: [],
};

const humanFallback = {
  ghsaId: 'GHSA-5555-5555-5555',
  state: 'published',
  outcome: 'actionable',
  severity: 'high',
  targets: [
    {
      package: 'pimcore/some-bundle',
      fixRepo: 'pimcore/some-bundle',
      location: null,
      ltsInScope: true,
      ltsLines: [],
    },
  ],
};

describe('formatTriagePlan', () => {
  it('always includes the read-only banner', () => {
    const out = formatTriagePlan([], { publicSafe: true });
    assert.ok(out.includes(BANNER));
    assert.ok(out.includes('(no advisories)'));
  });

  it('an actionable published entry shows the fix location and LTS lines', () => {
    const out = formatTriagePlan([actionablePublished], { publicSafe: false });
    assert.ok(out.includes('ACTIONABLE'));
    assert.ok(out.includes('fix on pimcore/data-hub@2026.1'));
    assert.ok(out.includes('LTS backport → 2025.4, 2024.4'));
  });

  it('a not-applicable entry shows its reason', () => {
    const out = formatTriagePlan([notApplicable], { publicSafe: false });
    assert.ok(out.includes('not applicable (no composer packages to route)'));
  });

  it('an already-handled entry shows its reason', () => {
    const out = formatTriagePlan([alreadyHandled], { publicSafe: false });
    assert.ok(out.includes('already handled (an open/merged issue or PR already references this advisory)'));
  });

  it('an actionable entry with no resolvable branch shows HUMAN-FALLBACK', () => {
    const out = formatTriagePlan([humanFallback], { publicSafe: false });
    assert.ok(out.includes('HUMAN-FALLBACK'));
  });

  it('under publicSafe, a non-published (triage) entry is redacted', () => {
    const out = formatTriagePlan([actionableTriage], { publicSafe: true });
    assert.ok(out.includes('details suppressed'));
    assert.ok(!out.includes('high'), 'severity must not leak');
    assert.ok(!out.includes('pimcore/pimcore'), 'package must not leak');
    assert.ok(!out.includes('ee-pimcore'), 'fixRepo/location must not leak');
    assert.ok(!out.includes('ACTIONABLE'));
  });

  it('under publicSafe, a published entry still renders in full', () => {
    const out = formatTriagePlan([actionablePublished], { publicSafe: true });
    assert.ok(!out.includes('details suppressed'));
    assert.ok(out.includes('ACTIONABLE'));
    assert.ok(out.includes('pimcore/data-hub'));
  });

  it('defaults to publicSafe=false when opts is omitted', () => {
    const out = formatTriagePlan([actionableTriage]);
    assert.ok(!out.includes('details suppressed'));
    assert.ok(out.includes('ACTIONABLE'));
  });
});
