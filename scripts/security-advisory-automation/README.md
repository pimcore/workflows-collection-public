# Security Advisory Automation

Tooling to triage Pimcore GitHub Security Advisories (GHSA) and route fixes to
the correct repository and branch. This directory currently contains the
**deterministic config layer** plus a **read-only dry-run**; the operational
workflows (auto-ticket + Copilot dispatch, forward-merge, LTS backport) are a
later phase.

## What's here

- `src/advisory_automation/` — pure routing logic (no I/O):
  - `ghsa.py` — `extract_ghsa_id` (the canonical dedup key)
  - `package_map.py` — `RepoConfig` + `resolve_repo` (composer package → repo)
  - `branches.py` — `is_unified_era`, `parse_compatible_line`,
    `select_lowest_active_line`, `ee_repo_name`, `select_branch_repo`
  - `advisory.py` / `routing.py` — parse an advisory and produce routing decisions
  - `advisory_source.py` — thin read-only `gh api` wrappers
  - `dryrun.py` — the read-only dry-run CLI
- `config/package_repo_map.yaml` — package→repo overrides (default is identity:
  `pimcore/X` → repo `pimcore/X`; ee-* LTS counterpart is derived by convention)
- `tests/` — pytest suite (pure-logic, fully covered)

## Key conventions

- **Dedup / traceability key:** the GHSA id, present in every artifact.
- **Fix repo:** the advisory's affected composer package's repo (often *not* the
  repo the advisory lives in). Identity by default; the map is for overrides.
- **Branch:** lowest active bugfix line, forward-merged upward; LTS backport
  (`ee-*` repo, derived by convention) only for severity ≥ high.
- The dry-run performs **no writes** — it only fetches and prints decisions.

## Run the tests

```bash
cd scripts/security-advisory-automation
python -m pytest -v        # or python3
```

## Run the dry-run (read-only)

Requires an authenticated `gh` with read access to the advisory source repo.

```bash
PYTHONPATH=src python -m advisory_automation.dryrun GHSA-xxxx-xxxx-xxxx
# or evaluate the most recent advisories:
PYTHONPATH=src python -m advisory_automation.dryrun --latest 5 --repo pimcore/pimcore
```

It prints, per affected package, the fix repo, the dedup key, and whether an LTS
backport is in scope — under a clear `DRY RUN — no … writes performed.` banner.

The same dry-run is runnable from the Actions tab via the
`Advisory Dry Run` (`workflow_dispatch`) workflow.
