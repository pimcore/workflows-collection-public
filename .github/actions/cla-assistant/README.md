# cla-assistant (vendored)

Copy of [contributor-assistant/github-action](https://github.com/contributor-assistant/github-action)
v2.6.1 (commit `ca4a40a7d1004f18d9960b404b97e5f30a505a08`, Apache-2.0, see LICENSE).
Upstream is archived since 2026-03-23 and ships no further releases.

Changes against upstream, nothing else:

- `dist/index.js`: `reRunLastWorkFlowIfRequired` returns early for
  `pull_request_target` as well as `pull_request`. The re-run of an earlier
  failed run is only needed for `issue_comment` events. On PR events the
  extra workflow-runs API calls fail the check on transient API errors
  although every committer has signed (DevOps-Tasks#81).
- `action.yml`: `runs.using` is `node24` instead of `node20`.

To verify, diff against the upstream tag:

```
sha256sum of upstream dist/index.js: a44111084c0d4782206c04b4276292f7fec6d1f7a33525512fbeef3242079dfb
```
