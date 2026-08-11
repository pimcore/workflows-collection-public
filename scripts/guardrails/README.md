# Guardrails (centralized)

Reusable guardrail pipelines. Consumer repos contain **only** thin, generic
trigger workflows; all logic lives here and is shared centrally, so a guardrail
or token change happens once here instead of across every consumer repo.

There are two pipelines, split by which events drive them:

- **PR guardrails** — `pull_request_target` / `check_suite`. Enforce that a PR is
  traceable and mergeable.
- **Repo guardrails** — repo-level events (today: `issues`). Enforce that reports
  land in the right repository.

## Layout

```
.github/workflows/parent-pr-guardrails.yml            PR orchestrator (workflow_call, no inputs)
.github/workflows/reusable-guardrail-membership.yml   Dev-Team membership / override → outputs bypass
.github/workflows/reusable-guardrail-issue-link.yml   non-members must link a valid issue
.github/workflows/reusable-guardrail-ci.yml           mergeable + all CI checks green

.github/workflows/parent-repo-guardrails.yml          repo orchestrator (workflow_call, no inputs)
.github/workflows/reusable-guardrail-external-issue.yml  close + redirect issues from outside the org

scripts/guardrails/lib.js                             shared helpers (loaded by each guardrail)
scripts/guardrails/tests/                             node:test suite for lib.js (Guardrails CI)
```

Run the helper tests with `cd scripts/guardrails && node --test`. `lib.js` is
loaded at runtime by every guardrail in ~63 repos, so it is covered by CI
(`.github/workflows/guardrails-ci.yml`) before anything reaches `main`.

## Consumer side (each repo, identical & frozen)

Two trigger files, both naming no guardrails, so they are identical across all
repos. Adding or changing a guardrail only touches this repo; only a **new event
type or a new token** requires a consumer-side change.

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
    secrets:
      MEMBERSHIP_GUARD_TOKEN: ${{ secrets.MEMBERSHIP_GUARD_TOKEN }}
      ISSUE_LINK_GUARD_TOKEN: ${{ secrets.ISSUE_LINK_GUARD_TOKEN }}
      CI_GUARD_TOKEN: ${{ secrets.CI_GUARD_TOKEN }}
```

```yaml
# .github/workflows/repo-guardrails.yml
name: Repo Guardrails
on:
  issues:
    types: [opened]
concurrency:
  # One lock per issue; never cancel, each run acts on a distinct issue.
  group: repo-guardrails-issue-${{ github.event.issue.number }}
  cancel-in-progress: false
jobs:
  guardrails:
    uses: pimcore/workflows-collection-public/.github/workflows/parent-repo-guardrails.yml@main
    secrets:
      MEMBERSHIP_GUARD_TOKEN: ${{ secrets.MEMBERSHIP_GUARD_TOKEN }}
```

Both are kept in sync from `.github/sync-templates/` via
`.github/workflows/sync-github-files.yml` — edit the template here, not the copy
in a consumer repo. Secrets are named rather than inherited: `secrets: inherit`
would hand every org secret the consumer can see to a workflow in another repo,
which is more than these guardrails need.

## PR pipeline

Comments are posted **only when a guardrail fails**. On a pass (or when a member
is exempt) no comment is created, and any prior failure comment is removed.

| Stage | Runs when | On failure |
|-------|-----------|------------|
| membership | `check_suite`, non-draft PR events, and `converted_to_draft` (skipped on draft PR events) | never drafts, never comments; emits `bypass` |
| issue-link | non-draft PR events **and** not bypassed | draft + comment (reason + docs link) |
| ci | all events (PR + `check_suite`) **and** not bypassed | draft + comment (reason) |

- **Cancellation**: the enforcing stages gate on `!cancelled()`, never `always()`
  — `always()` runs a job *even when the run is cancelled*, and the consumer
  trigger uses `cancel-in-progress`, so back-to-back PR events cancel runs
  routinely. A cancelled membership stage emits no `bypass`, and enforcing on
  that empty value drafts exempt members' PRs. Cancellation is safe to skip
  because the superseding run re-evaluates the PR immediately. Every **other**
  non-success membership result (failed, skipped) still enforces, so a broken
  membership stage can never silently disable the guardrails.
- **Age exemption**: PRs created **before `GUARD_START_DATE`** (default
  `2026-07-07`) are exempt — every guardrail skips them, so the policy only
  applies to PRs opened on/after that date.
- **Bypass**: the membership stage emits `bypass=true` (orchestrator skips both
  issue-link and CI) when the PR author is a Dev-Team member, the PR author is
  the guard service account (`pimcore-deployments`), the PR carries the
  `guardrails:override` label, or a Dev-Team member overrode it (see below).
  Otherwise non-members must link a valid issue in `pimcore/platform-version`
  via a closing keyword (every closing-keyword reference must be valid) **and**
  pass CI.
- **Bypass clears failure comments**: on a `pull_request_target` event a bypassed
  PR also has every marker comment in `lib.GUARDRAIL_MARKERS` removed, so a
  comment left by an earlier run never lingers on an exempt PR. Not done on
  `check_suite` (it fires many times per push, and a PR event always follows the
  situations that leave a stale comment behind). Applying the
  `guardrails:override` label by hand is the one bypass the consumer trigger does
  not subscribe to — its comments clear on the PR's next event.
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

## Repo pipeline

| Stage | Runs when | Action |
|-------|-----------|--------|
| external-issue | `issues: opened` | Issue author is outside the `pimcore` org → comment with the correct channels, label `guardrails:wrong-repo`, close as `not_planned` |

`external-issue` exists because web-UI issue creation is disabled in these repos
(`.github/ISSUE_TEMPLATE/config.yml` → `blank_issues_enabled: false` plus contact
links only) but the REST API and `gh issue create` still work. All public reports
belong in `pimcore/platform-version`.

It **never acts** when any of these hold:

- The repo *is* the issue-of-record repo (`GUARD_ISSUE_OWNER`/`GUARD_ISSUE_REPO`,
  default `pimcore/platform-version`). Config-driven, so there is no exclusion
  list to keep in sync — though the rollout also simply omits that repo.
- The author is automation — a `Bot` account, a `…[bot]` login, the guard service
  account, or a login in `GUARD_ISSUE_ALLOWLIST`.
- The author is a member of the `pimcore` org, **public or private membership**.

Membership is the whole `pimcore` org here, not just `dev-team`, so colleagues
outside the Dev-Team (docs, support, product) can file issues normally.

> **Why the guardrail fails loudly on a mis-scoped token.** `GET /orgs/{org}/members/{username}`
> answers `302` when the *requesting* token is not itself an org member,
> redirecting to the public-members endpoint — and Octokit follows that redirect
> transparently. The lookup then returns clean `204`/`404` answers computed from
> **public membership only**, so every privately-listed employee would look
> external and have their issue closed. Nothing in the response distinguishes that
> from a real answer, so `lib.assertCanReadOrgMembership` verifies up front that
> the token's own account is an active org member and throws if it is not.

## Stale draft PRs (elsewhere)

The draft-PR lifecycle that follows up on guardrail failures — friendly reminder
after two weeks of no human activity, close two weeks later — is **not** here. It
needs a schedule, and it runs as one central sweep in the private
`pimcore/workflows-centralized` repo
(`.github/workflows/pr-guardrail-stale-draft.yml`), so draft-PR details from
private repos never land in a public Actions log. It loads this repo's `lib.js`
and keys off the `GUARDRAIL_MARKERS` failure comments, which is how it tells a
guardrail-drafted PR from a contributor's own work-in-progress draft.

Two consequences worth knowing when changing things here:

- Renaming or removing a marker in `GUARDRAIL_MARKERS` changes what that sweeper
  considers guardrail-drafted.
- The comment/label helpers are called cross-repo by the sweeper with a shim
  context (`{ repo: { owner, repo }, payload: {} }`) plus an explicit
  `issueNumber`. Keep them reading no more of `context` than that.

## Adding a new guardrail

1. Add `reusable-guardrail-<x>.yml` here (`workflow_call`, one token secret).
2. Add a job to `parent-pr-guardrails.yml` (PR events) or
   `parent-repo-guardrails.yml` (repo events) and pass it the token.
3. If it needs a new token, add **one** org-level secret **and** add it to the
   matching `.github/sync-templates/{pr,repo}-guardrails.yml` trigger.
4. If it posts a failure comment, add its marker to `GUARDRAIL_MARKERS` in
   `lib.js` — otherwise its comments are never cleared when a PR is bypassed.
5. Cover the logic you added to `lib.js` in `scripts/guardrails/tests/`.

No consumer repo is touched unless step 3 applies.

## Configuration

`lib.js` reads these from the environment:

- `GUARD_ORG` (default `pimcore`) — used for Dev-Team lookups **and** for the
  org-membership check in `external-issue`.
- `GUARD_TEAM_SLUG` (default `dev-team`) — confirm the slug of "Dev-Team"
- `GUARD_ISSUE_OWNER` / `GUARD_ISSUE_REPO` (default `pimcore` / `platform-version`)
  — the issue-of-record repo. Both the issue-link guardrail (what a PR must link
  to) and `external-issue` (where to redirect, and which repo to skip) read it.
- `GUARD_BOT_LOGIN` (default `pimcore-deployments`) — the service account the
  guardrails act as. Used to (a) ignore the bot's own draft-conversions during
  override retraction, and (b) restrict marker-comment management to the bot's
  own comments. **Set this if your guardrail tokens belong to a different
  account**, or retraction and comment cleanup will misbehave.
- `GUARD_ISSUE_ALLOWLIST` (default `Copilot,claude,pimcore-deployments`) —
  comma-separated logins treated as automation on top of the generic `Bot` /
  `…[bot]` detection, so their issues are never closed. Matched
  case-insensitively.
- `GUARD_SUPPORT_URL` / `GUARD_DISCUSSIONS_URL` — the private-report and
  discussion channels `external-issue` redirects to. They mirror the
  `contact_links` in each consumer repo's `.github/ISSUE_TEMPLATE/config.yml`, so
  they are configuration rather than literals in the workflow: if a portal moves,
  it is one env var here instead of an edit to the guardrail. The public tracker
  and the advisories link are not listed — both are derived from
  `GUARD_ISSUE_OWNER`/`GUARD_ISSUE_REPO`.
- `GUARD_START_DATE` (default `2026-07-07`) — only PRs **created on/after** this
  date are checked; older PRs are exempt (all PR guardrails skip). Set to empty to
  disable the date gate and check every PR. Does not apply to `external-issue`,
  which only ever sees freshly opened issues.

## Security

The PR guardrails run in the caller's `pull_request_target` context but only read
PR metadata as data and call APIs. They check out **this** (trusted) repo to load
`lib.js`, never the PR head, so the usual `pull_request_target` code-injection
risk does not apply. PR title/body are regex-parsed only.

`external-issue` runs on `issues`, which has no fork-code exposure at all. It
reads the issue author's login and nothing else from the payload — the issue title
and body are never parsed, interpolated or echoed, so a crafted issue body cannot
influence the workflow.
