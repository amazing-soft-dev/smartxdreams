# Pipeline probe 1: happy path (issue #68)

This file exists only to give the pipeline a doc-only change to carry end to end.

## Expected sequence

1. Pushing `docs/68-pipeline-probe-happy-path` makes **Open pull request** open a PR into `dev`.
2. **CI** runs on the PR. In bootstrap mode the lint and build jobs are skipped and **CI passed** is green, with exactly one summary comment on the PR.
3. After CI succeeds, **Merge passing pull request** merge-commits the PR into `dev` (the PR head must still be the commit CI validated).
4. The push to `dev` makes **Open pull request** open `dev` → `main`, with `Closes #68` in the body.
5. CI runs on that PR, then **Merge passing pull request** merges it into `main`.
6. GitHub closes #68 by itself.

No human step is involved. If any step needs a person, the pipeline is broken and a `ci/` fix issue is opened.

- Race probe step 1 (00:57:15 UTC)

- Race probe step 2 (00:57:44 UTC)
