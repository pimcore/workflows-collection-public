# Security Advisory Automation

Tooling to triage Pimcore GitHub Security Advisories (GHSA) and route fixes to
the correct repository and branch. This directory currently contains the
**deterministic config layer** plus a **read-only dry-run**; the operational
workflows (auto-ticket + Copilot dispatch, forward-merge, LTS backport) are a
later phase.

## What's here

- `lib/` — pure routing logic (no I/O):
  - `lib/ghsa.js` — `extractGhsaId` (the canonical dedup key)
  - `lib/branches.js` — `isUnifiedEra`, `parseCompatibleLine`,
    `selectLowestActiveLine`, `eeRepoName`, `selectBranchRepo`
  - `lib/advisory.js` / `lib/routing.js` — parse an advisory and produce routing decisions
  - `lib/source.js` — thin read-only `gh api` wrappers (local) and octokit wrappers (CI)
  - `lib/report.js` — `buildReport`, `formatReport`, `BANNER`
- `index.js` — re-exports the full public API; `runDryRun` for use via `github-script`
- `cli.js` — thin local CLI (shells to `gh`); convenience only, not used in CI
- `tests/*.test.js` — node:test suite (pure-logic, no network)

## Key conventions

- **Dedup / traceability key:** the GHSA id, present in every artifact.
- **Fix repo:** the advisory's affected composer package's repo (often *not* the
  repo the advisory lives in), by identity convention (`pimcore/X` → repo
  `pimcore/X`). A package whose repo name differs is caught by the existence
  check and falls to human-fallback — no maintained map.
- **Branch:** lowest active bugfix line, forward-merged upward; LTS backport
  (`ee-*` repo, derived by convention) only for severity ≥ high.
- The dry-run performs **no writes** — it only fetches and prints decisions.

## Run the tests

```bash
cd scripts/security-advisory-automation
node --test
```

## Run the dry-run locally (read-only)

Requires an authenticated `gh` with read access to the advisory source repo.

```bash
cd scripts/security-advisory-automation
node cli.js GHSA-xxxx-xxxx-xxxx [--repo pimcore/pimcore]
# or evaluate the most recent advisories:
node cli.js --latest 5 --repo pimcore/pimcore
```

It prints, per affected package, the fix repo, the dedup key, and whether an LTS
backport is in scope — under a clear `DRY RUN — no … writes performed.` banner.

## Run the dry-run in CI (read-only)

The `Advisory Dry Run` workflow (`workflow_dispatch`) runs the dry run entirely
via `actions/github-script` (octokit) — no local node dependencies, no `gh`
shell-out. Trigger it manually from the Actions tab, providing a GHSA id and
optionally a source repo.

If the workflow token lacks advisory read access, add an `ADVISORY_READ_TOKEN`
secret (a PAT with security-advisory read scope).
