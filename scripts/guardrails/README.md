# PR Guardrails (centralized)

Reusable PR-guardrail pipeline. Consumer repos contain **only** a thin, generic
trigger workflow; all logic lives here and is shared centrally, so a guardrail
or token change happens once here instead of across every consumer repo.

## Layout

```
.github/workflows/parent-pr-guardrails.yml      orchestrator (workflow_call, no inputs)
.github/workflows/reusable-guardrail-membership.yml   Dev-Team membership → outputs is_member
.github/workflows/reusable-guardrail-issue-link.yml   non-members must link a valid issue
.github/workflows/reusable-guardrail-ci.yml           mergeable + all CI checks green
scripts/guardrails/lib.js                       shared helpers (loaded by each guardrail)
```

## Consumer side (each repo, identical & frozen)

```yaml
# .github/workflows/pr-guardrails.yml
name: PR Guardrails
on:
  pull_request_target:
    types: [opened, reopened, ready_for_review, edited, synchronize]
  check_suite:
    types: [completed]
concurrency:
  group: pr-guardrails-${{ github.event.pull_request.number || github.event.check_suite.pull_requests[0].number || github.event.check_suite.head_sha || github.run_id }}
  cancel-in-progress: true
jobs:
  guardrails:
    uses: pimcore/workflows-collection-public/.github/workflows/parent-pr-guardrails.yml@main
    secrets: inherit
```

The trigger names no guardrails and no secrets (`inherit`), so it is identical
across all repos and never needs editing when a guardrail or token is
added/removed — that only changes this repo (+ org secrets).

## Pipeline

Comments are posted **only when a guardrail fails**. On a pass (or when a member
is exempt) no comment is created, and any prior failure comment is removed.

| Stage | Runs when | On failure |
|-------|-----------|------------|
| membership | all events (resolves author on PR + `check_suite`) | never drafts, never comments; emits `is_member` |
| issue-link | non-draft PR events **and** author is not a Dev-Team member | draft + comment (reason + docs link) |
| ci | all events (PR + `check_suite`) **and** author is not a Dev-Team member | draft + comment (reason) |

- **Members are fully exempt**: if the PR author is a Dev-Team member,
  `is_member=true` and the orchestrator **skips every other guardrail** (both
  issue-link and CI). Non-members must link a valid issue in
  `pimcore/platform-version` via a closing keyword (every closing-keyword
  reference must be valid) **and** pass CI.
- **ci** requires the PR to be mergeable (no conflicts) and all checks/statuses
  green. It ignores any guardrail checks (name contains `guardrail`) to avoid
  self-deadlock and to not count a sibling guardrail's failure as a CI failure,
  and considers only the latest run per check name so a stale failure that was
  re-run green no longer counts.
- Supported keywords: `close, closes, closed, fix, fixes, fixed, resolve,
  resolves, resolved`.

## Revalidation

On failure a guardrail converts the PR to **draft** and posts a single marker
comment with the reason (issue-link also links the GitHub keywords docs). The PR
author fixes the issue and clicks **Ready for review**; the `ready_for_review`
event re-fires the pipeline. When the guardrail then passes, its failure comment
is removed.

## Tokens & required settings

Org-level secrets shared to consumer repos, reached via `secrets: inherit`:
`MEMBERSHIP_GUARD_TOKEN`, `ISSUE_LINK_GUARD_TOKEN`, `CI_GUARD_TOKEN`. The
orchestrator passes only the one relevant token to each guardrail.

Use a **GitHub App installation token** (recommended) or a **classic PAT**. The
granular names below are GitHub App permissions; a fine-grained PAT cannot be
used for `CI_GUARD_TOKEN` because it has no *Checks* permission.

| Token | GitHub App permissions (by target repo / org) | Classic PAT scopes | Used for |
|-------|-----------------------------------------------|--------------------|----------|
| `MEMBERSHIP_GUARD_TOKEN` | consumer repo → Pull requests: **Read**; `pimcore` org → Members: **Read** | `repo` (or `public_repo`) + `read:org` | Team-membership lookup; read PR(s) (incl. resolving from `check_suite`). Never drafts, never comments. |
| `ISSUE_LINK_GUARD_TOKEN` | consumer repo → Pull requests: **R&W**; `pimcore/platform-version` → Issues: **Read** | `repo` (+ read on `platform-version` if private) | Validate linked issues exist; convert PR to draft; comment. No org permission. |
| `CI_GUARD_TOKEN` | consumer repo → Pull requests: **R&W**, Checks: **Read**, Commit statuses: **Read**, Contents: **Read** | `repo` | Read PR + mergeability; list checks & statuses; convert PR to draft; comment. No org permission. |

Notes:
- `Checks` is a GitHub App permission only — it is **not** available to
  fine-grained PATs (those have `Commit statuses` but no `Checks`). For
  `CI_GUARD_TOKEN` use a GitHub App token or a classic PAT (`repo`).
- For a PR, both commenting and draft conversion fall under `Pull requests:
  write` (`Issues: write` is a safe superset if your token distinguishes).
- This collection is **public**, so the guardrails check it out anonymously to
  load `lib.js` — the tokens need **no** access to it, and no cross-repo *Access*
  setting is required (public reusable workflows are callable by any repo).

## Adding a new guardrail

1. Add `reusable-guardrail-<x>.yml` here (`workflow_call`, one token secret).
2. Add a job to `parent-pr-guardrails.yml` and pass it the token.
3. If it needs a new token, add **one** org-level secret.

No consumer repo is touched.

## Configuration

`lib.js` reads `GUARD_ORG`, `GUARD_TEAM_SLUG`, `GUARD_ISSUE_OWNER`,
`GUARD_ISSUE_REPO` from the environment (defaults `pimcore` / `dev-team` /
`pimcore/platform-version`). Confirm the **team slug** — the slug of "Dev-Team"
is assumed to be `dev-team`.

## Security

All guardrails run in the caller's `pull_request_target` context but only read PR
metadata as data and call APIs. They check out **this** (trusted) repo to load
`lib.js`, never the PR head, so the usual `pull_request_target` code-injection
risk does not apply. PR title/body are regex-parsed only.
