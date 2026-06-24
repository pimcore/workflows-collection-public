# PR Guardrails (centralized)

Reusable PR-guardrail pipeline. Consumer repos contain **only** a thin, generic
trigger workflow; all logic lives here and is shared centrally, so a guardrail
or token change happens once here instead of across every consumer repo.

## Layout

```
.github/workflows/parent-pr-guardrails.yml      orchestrator (workflow_call, no inputs)
.github/workflows/reusable-guardrail-membership.yml   Dev-Team membership / override → outputs bypass
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
    types: [opened, reopened, ready_for_review, converted_to_draft, edited, synchronize]
  check_suite:
    types: [completed]
concurrency:
  # Separate group for converted_to_draft so a guardrail's own draft-conversion
  # does not cancel the run that is still acting on the PR.
  group: pr-guardrails-${{ github.event.action == 'converted_to_draft' && 'retract-' || '' }}${{ github.event.pull_request.number || github.event.check_suite.pull_requests[0].number || github.event.check_suite.head_sha || github.run_id }}
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
| membership | `check_suite`, non-draft PR events, and `converted_to_draft` (skipped on draft PR events) | never drafts, never comments; emits `bypass` |
| issue-link | non-draft PR events **and** not bypassed | draft + comment (reason + docs link) |
| ci | all events (PR + `check_suite`) **and** not bypassed | draft + comment (reason) |

- **Bypass**: the membership stage emits `bypass=true` (orchestrator skips both
  issue-link and CI) when the PR author is a Dev-Team member, the PR carries the
  `guardrails:override` label, or a Dev-Team member overrode it (see below).
  Otherwise non-members must link a valid issue in `pimcore/platform-version`
  via a closing keyword (every closing-keyword reference must be valid) **and**
  pass CI.
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

## Override (Dev-Team)

If a **Dev-Team member** clicks **Ready for review** on a PR — even one opened by
a non-member that the guardrails keep drafting — the membership stage treats it
as an override: it adds the `guardrails:override` label, **removes any guardrail
failure comments**, and emits `bypass=true`, so issue-link and CI are skipped and
the PR stays ready. The label persists, so later `check_suite` runs and pushes
keep bypassing instead of re-drafting.

To **retract** an override, a Dev-Team member converts the PR back to draft
(`converted_to_draft`): the `guardrails:override` label is removed, so the
guardrails apply again the next time the PR is made ready. Only a member's
draft-conversion clears it — the guardrails' own drafting (by the bot token)
does not.

## Adding a new guardrail

1. Add `reusable-guardrail-<x>.yml` here (`workflow_call`, one token secret).
2. Add a job to `parent-pr-guardrails.yml` and pass it the token.
3. If it needs a new token, add **one** org-level secret.

No consumer repo is touched.

## Configuration

`lib.js` reads these from the environment:

- `GUARD_ORG` (default `pimcore`)
- `GUARD_TEAM_SLUG` (default `dev-team`) — confirm the slug of "Dev-Team"
- `GUARD_ISSUE_OWNER` / `GUARD_ISSUE_REPO` (default `pimcore` / `platform-version`)
- `GUARD_BOT_LOGIN` (default `pimcore-deployments`) — the service account the
  guardrails act as. Used to (a) ignore the bot's own draft-conversions during
  override retraction, and (b) restrict marker-comment management to the bot's
  own comments. **Set this if your guardrail tokens belong to a different
  account**, or retraction and comment cleanup will misbehave.

## Security

All guardrails run in the caller's `pull_request_target` context but only read PR
metadata as data and call APIs. They check out **this** (trusted) repo to load
`lib.js`, never the PR head, so the usual `pull_request_target` code-injection
risk does not apply. PR title/body are regex-parsed only.
