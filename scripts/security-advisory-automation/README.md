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
  - `lib/triage.js` — `classifyAdvisory` (already-handled / not-applicable /
    actionable) and `artifactSearchQuery` (org-wide dedup search)
  - `lib/versions.js` — `loadSupportedVersions`, `lowestActiveBugfixLine`, `ltsLinesInScope`
  - `lib/source.js` — thin read-only `gh api` wrappers (local) and octokit wrappers (CI)
  - `lib/report.js` — `buildReport`, `formatReport`, `BANNER` (single-advisory dry run)
  - `lib/orchestrate.js` — read-only **Workflow 1** orchestration: `runTriage`
    (fetch → dedup → classify → resolve target branch), plus its GET-only
    octokit helpers `searchHandled`, `branchExists`, `resolveFixLocation`
  - `lib/triage-report.js` — `formatTriagePlan`, `BANNER` (triage-sweep report)
- `index.js` — re-exports the full public API; `runDryRun` / `runTriage` for use via `github-script`
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

Because this repository is public and Actions logs are world-readable, the CI
dry-run **redacts non-published advisories** (prints only a minimal
acknowledgment with the GHSA id and state). Use the local CLI for full detail
on `triage`/unpublished advisories.

## Triage (plan mode)

Workflow 1's read-only "plan mode": for the most recent advisories on the
source repo, sweep through fetch → dedup (org-wide issue/PR search) → classify
(`already-handled` / `not-applicable` / `actionable`) → for actionable
advisories, resolve the initial fix location (base repo, else its `ee-*`
counterpart, else human-fallback) and the LTS backport lines in scope. Prints
a plan. **Strictly read-only** — every `github.request` call is a GET; nothing
is ticketed, opened, or written.

### Locally (full detail)

Requires an authenticated `gh` with read access to the advisory source repo
and to search issues/PRs. Runs against a small octokit-shim over `gh api`, not
octokit — so no local Node dependencies beyond `gh` itself.

```bash
cd scripts/security-advisory-automation
node cli.js --triage [--repo pimcore/pimcore] [--limit N]
```

This runs with `publicSafe: false`, so `triage`/unpublished advisories are
shown in full (severity, affected packages, resolved branch, LTS scope) —
appropriate for a local run, never for a public log.

### In CI (read-only, redacted)

The `Advisory Triage` workflow (`workflow_dispatch`, plus an optional weekly
schedule) runs `runTriage` via `actions/github-script` (octokit only). It runs
with `permissions: contents: read, security-events: read` and `publicSafe:
true`: non-`published` advisories are shown as a minimal redacted line (no
severity, package, or repo) since Actions logs on this public repo are
world-readable. Trigger it manually from the Actions tab, optionally
overriding the source repo or the number of advisories to evaluate.

If the workflow token lacks advisory read (or org search) access, add an
`ADVISORY_READ_TOKEN` secret (a PAT with security-advisory read scope).
