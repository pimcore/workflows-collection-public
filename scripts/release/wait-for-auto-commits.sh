#!/usr/bin/env bash
# Wait until no frontend-build workflow run is queued or running on
# OWNER/REPO@BRANCH and HEAD has stayed put. The build commit lands minutes
# after a merge or CE->EE sync; tagging before it exists would ship stale
# frontend assets.
#
# Usage: wait-for-auto-commits.sh OWNER REPO BRANCH   (RELEASE_TOKEN in env)
# Prints the stable HEAD sha. Fails open (warning, exit 0) when the API cannot
# be read, fails closed (exit 2) only when jobs are still pending at the timeout.
set -euo pipefail
OWNER="$1"; REPO="$2"; BRANCH="$3"
API="https://api.github.com/repos/${OWNER}/${REPO}"
TIMEOUT_MIN="${WAIT_TIMEOUT_MINUTES:-20}"
SETTLED_AGE_SEC="${WAIT_SETTLED_AGE_SECONDS:-600}"
DEADLINE=$(( $(date +%s) + TIMEOUT_MIN * 60 ))
CURL=(curl -sS --retry 3 --retry-all-errors --max-time 30
      -H "Authorization: Bearer ${RELEASE_TOKEN}"
      -H "Accept: application/vnd.github+json"
      -H "X-GitHub-Api-Version: 2022-11-28")

warn_exit() { echo "::warning::${OWNER}/${REPO}@${BRANCH}: $1, not waiting for auto-commits" >&2; echo "${2:-}"; exit 0; }

# Prints "<sha> <epoch of committer date>", or nothing on any failure.
head_info() {
  "${CURL[@]}" "${API}/commits/${BRANCH}" 2>/dev/null \
    | jq -r 'select(.sha != null) | "\(.sha) \(.commit.committer.date | fromdateiso8601)"' 2>/dev/null || true
}

# Prints the number of frontend-build workflow runs (workflow path contains
# "frontend") not yet completed on the BRANCH, -1 on any failure. Queried by
# branch, not by head sha: a run started on an older commit still checks out
# the branch by name and pushes its build commit on top of the current head.
# Check runs are not used either: jobs of a called reusable workflow get their
# check run only when they start.
pending_frontend_runs() {
  local body total
  body=$("${CURL[@]}" "${API}/actions/runs?branch=${BRANCH}&per_page=100" 2>/dev/null) || { echo -1; return; }
  total=$(jq -r '.total_count // empty' <<<"$body" 2>/dev/null) || { echo -1; return; }
  [[ -n "$total" ]] || { echo -1; return; }
  jq '[.workflow_runs[] | select(.status != "completed") | select(.path | test("frontend"; "i"))] | length' <<<"$body"
}

clean=0
read -r sha date <<<"$(head_info)" || true
[[ -n "${sha:-}" ]] || warn_exit "cannot resolve HEAD"
while :; do
  n=$(pending_frontend_runs)
  [[ "$n" != "-1" ]] || warn_exit "cannot read workflow runs with RELEASE_TOKEN" "$sha"
  read -r new newdate <<<"$(head_info)" || true
  [[ -n "${new:-}" ]] || warn_exit "cannot re-resolve HEAD" "$sha"
  if [[ "$n" == "0" && "$new" == "$sha" ]]; then
    clean=$((clean + 1))
    # Settled: no pending jobs and the head is old enough that no run is still
    # being created for it; otherwise require a second clean tick.
    if [[ $clean -ge 2 || $(( $(date +%s) - date )) -ge $SETTLED_AGE_SEC ]]; then echo "$sha"; exit 0; fi
  else
    clean=0
    if [[ "$new" != "$sha" ]]; then echo "${OWNER}/${REPO}@${BRANCH}: HEAD moved ${sha:0:8} -> ${new:0:8}" >&2; sha="$new"; date="$newdate"; fi
    [[ "$n" == "0" ]] || echo "${OWNER}/${REPO}@${BRANCH}: ${n} frontend run(s) pending on ${sha:0:8}, waiting" >&2
  fi
  if [[ $(date +%s) -ge $DEADLINE ]]; then
    echo "::error::${OWNER}/${REPO}@${BRANCH}: frontend runs still pending after ${TIMEOUT_MIN} min, re-run the release later" >&2
    exit 2
  fi
  sleep 20
done
