# Pipeline guide

How a change reaches production in this repository, and how to set the pipeline up.

## The path of a change

Two long-lived branches. `dev` is where work lands. `main` is the release branch. **Nobody pushes to either one.** Rulesets block direct pushes, force-pushes and deletion; a change lands only through a pull request, only as a **merge commit**, and only after the **CI passed** check is green. No human review is required.

1. Open a GitHub issue and note the number.
2. Branch from `origin/dev` with a prefix `feat/`, `fix/`, `docs/`, `ci/` or `build/`, number first: `feat/12-short-description`.
3. Commit with Conventional Commit subjects (`feat(home): short description`). A `Closes #12` line on the last commit is optional when the branch name already has the number.
4. Push. Three workflows take over:

| Workflow | File | What it does |
|---|---|---|
| Open pull request | `.github/workflows/open-pull-request.yml` | Branch push → PR into `dev`. A push to `dev` → opens or updates `dev` → `main` and writes `Closes #N` lines (from branch names and `Closes/Fixes/Resolves` lines since `main`). A keyword on the PR into `dev` does **not** close issues; only the PR into `main` does |
| CI | `.github/workflows/ci.yml` | Runs on every PR, on pushes to `dev` and `main`, and on manual dispatch. A newer push cancels the older run. Jobs: detect app, actionlint, lint and type check, build (server and static), and **CI passed** (the single required check) |
| Merge passing pull request | `.github/workflows/merge-passing-pr.yml` | After CI succeeds on a PR, merge-commits it if the head is still the commit CI validated (`--match-head-commit`). Eligible pairs: a prefix branch into `dev`, `dev` into `main`, and a Dependabot update into `dev` (see below). Anything else is left alone |

The merge into `dev` pushes `dev`, which opens or updates `dev` → `main`; CI runs again and a green run merges into `main`; GitHub then closes the issues listed in that PR body. A merge to `main` only re-runs CI: **Actions never deploys.** Vercel deploys from its Git connection with Production tracking `main`.

### Dependabot

Dependabot (`.github/dependabot.yml`) opens weekly PRs into `dev` for npm (minor and patch grouped; majors one per PR) and GitHub Actions (grouped). CI runs on them like any PR. When CI passes, the merge workflow merges one into `dev` only if:

- the PR is opened by `dependabot[bot]`, and so is its head commit. If anyone pushes to the branch, it waits for a person.
- it is a GitHub Actions update, or an npm update whose commit metadata has no `update-type: version-update:semver-major`.

npm major updates stay open for a person to review and merge. After a merge, the usual `dev` → `main` promotion follows.

Runs started by Dependabot can only read **Dependabot secrets**, not Actions secrets. So `GH_TOKEN` must also be saved under Settings → Secrets and variables → **Dependabot**, with the same name and value. Without it, the merge job fails with "GH_TOKEN is not set as a Dependabot secret".

### Why `GH_TOKEN`, not `GITHUB_TOKEN`

Pull requests and merges made with the default `GITHUB_TOKEN` do not start further workflow runs. The pipeline needs the merge into `dev` to start the `dev` push run, so the open-PR and merge workflows use the **`GH_TOKEN`** repository secret.

## Owner setup (once)

1. **Create a fine-grained personal access token** for this repository only: Contents, Pull requests, Issues and Workflows = **Read and write**; Metadata = Read. Set an expiry and note it below.
2. Save it as the repository secret **`GH_TOKEN`** (Settings → Secrets and variables → Actions), and again with the same name as a **Dependabot** secret (Settings → Secrets and variables → Dependabot). Update both when the token is rotated.
3. Settings → Actions → General: turn on **Allow GitHub Actions to create and approve pull requests**; keep default workflow permissions **read-only**.
4. Leave the rulesets **unimported** until the first pipeline probes pass (see below).

Token expiry: _record the date here when the token is created._

## Bootstrap mode

While `package.json` does not exist, CI cannot run `npm ci`. Its **Detect app** step handles that:

| `package.json` | `.github/ci-bootstrap` | CI behaviour |
|---|---|---|
| present | n/a | Strict: lint, type check and both builds run and must pass |
| missing | present | Bootstrap: those jobs are skipped; **CI passed** is still green |
| missing | absent | **CI fails** (this is the guard against deleting the app) |

`.github/ci-bootstrap` is deleted by issue #67 when the app is restored, after which CI is always strict.

`images`, `check:images` and `verify:out` run with `--if-present` until issue #2 adds those scripts; that issue removes the flag.

## The two manual merges

`merge-passing-pr` is a `workflow_run` workflow, and GitHub reads those from the **default branch**. Until the file is on `main` it cannot act. So, once:

1. The PR for `ci/3-github-workflows` into `dev` is merged by the repository owner.
2. That merge pushes `dev`, which opens `dev` → `main`. The owner merges it after CI is green.

From then on every step is automatic.

## Rulesets

After the pipeline probes (#68, #69) pass, the owner imports both files:

```bash
gh api repos/amazing-soft-dev/smartxdreams/rulesets --method POST --input .github/rulesets/dev.json
gh api repos/amazing-soft-dev/smartxdreams/rulesets --method POST --input .github/rulesets/main.json
```

(Or Settings → Rules → New ruleset → Import a ruleset.) Both rulesets: no deletion, no force-push, pull request required with **merge commit only**, required status check **CI passed**, no approving review, **no bypass list**.

## Pipeline checks

The gate before any site code is the 15-point checklist in `SMARTXDREAMS-PLAN.md` §7.4, run by issues #68 (happy path), #69 (red CI, recovery, cancel) and #70 (rules and abuse paths). Results are recorded as run and PR links on those issues.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Open-PR or merge workflow fails with "GH_TOKEN … not set" | Secret missing or expired |
| Merge workflow fails on a Dependabot PR with "not set as a Dependabot secret" | `GH_TOKEN` is saved as an Actions secret only; add it as a Dependabot secret too |
| A Dependabot PR stays open after CI passes | npm semver-major update, or someone pushed to the branch: the merge run's notice says which. Review and merge by hand |
| PR opened but merge never happens, right after setup | `merge-passing-pr.yml` is not on `main` yet (see the two manual merges) |
| No PR for a branch | Name is not `<prefix>/<number>-<slug>`; non-prefix branches (`wip/…`) do not trigger the workflow at all |
| CI red with "package.json is missing" | The app was deleted without the bootstrap flag; restore `package.json` |
| Merge skipped: "head is not the commit CI validated" | A newer commit was pushed after CI started; the newer run will merge |

## Verification checklist

Run by the pipeline probe issues (#68 happy path, #69 red CI, #70 rules and abuse paths). Results are recorded as run and PR links on those issues.

| # | Check | Pass criterion |
|---|---|---|
| 1 | Prefixed branch opens a PR | `feat/ fix/ docs/ ci/ build/` + `<n>-slug` opens a PR into `dev` |
| 2 | Bad branch ignored | `wip/…`, and a prefixed branch with no issue number, get no PR |
| 3 | CI summary comment | Exactly one comment, updated, not duplicated |
| 4 | Green merges automatically | Merge commit on `dev`, head validated |
| 5 | `dev` push opens or updates `dev` → `main` | Correct `Closes` lines, no duplicate PR |
| 6 | `dev` → `main` merges after green CI | Linked issues close |
| 7 | Red CI never merges | PR stays open, "CI passed" red |
| 8 | Newer push cancels the older run | Stale run shows cancelled |
| 9 | Direct push to `dev` and `main` rejected | Rejected by ruleset |
| 10 | Force-push and branch deletion rejected | Rejected on both |
| 11 | Merge without green "CI passed" blocked | Blocked by required check |
| 12 | Non-merge-commit methods blocked | Squash and rebase rejected |
| 13 | Non-eligible pairs untouched | A feature → `main` PR is not auto-merged |
| 14 | Head-moved race | No merge on the old SHA |
| 15 | A bot merge starts the next workflow | The `dev` push run exists after step 4 |

## Probe results

### Probe 2: red CI and recovery (issue #69)

- Removing `.github/ci-bootstrap` with no `package.json` made **Detect app** fail and **CI passed** fail. The summary comment said "CI failed", and "Merge passing pull request" was skipped, so PR #78 stayed open.
- After the fix commit, CI went green, the PR merged into `dev`, the `dev` → `main` PR opened and merged, and #69 closed with no human step.
- The "newer push cancels the older run" check was **not** exercised here (both commits went out in one push). It is covered in probe 3 below.
- Finding: the summary's `Mode` line read "bootstrap" when detect-app failed, because the app output is empty. Cosmetic; fixed in issue #70.

### Probe 3: rules and abuse paths (issue #70)

Run after the `dev` and `main` rulesets were imported. Nothing here needs a human step.

| # | Check | Result | Evidence |
|---|---|---|---|
| 2 | Bad branches ignored | Pass | `wip/70-noneligible` triggered no workflow; `ci/guard-no-number` ran Open pull request, logged a notice and opened no PR |
| 8 | Newer push cancels the older run | Pass | Pushing step 2 while step 1's CI was running left run 43783418908 `cancelled` |
| 9 | Direct push rejected | Pass | Pushes to `dev` and to `main` were declined: "Required status check CI passed is expected" |
| 10 | Force-push and deletion rejected | Pass | Force-pushes were declined: "Changes must be made through a pull request". Deletion was proved on a throwaway branch under a temporary deletion-only ruleset ("Cannot delete this branch"), and both real rulesets contain the `deletion` rule |
| 11 | Merge before CI passed blocked | Pass | `gh pr merge` on PR #80 before CI finished: "base branch policy prohibits the merge" |
| 12 | Squash and rebase blocked | Pass | "Squash merges are not allowed" and "Rebase merges are not allowed" on PR #80 after CI was green |
| 13 | Non-eligible pair untouched | Pass | #80 (`wip/…` → `main`) was not merged; log: "is not an eligible pair. Leaving it." |
| 14 | Head moved after CI passed | Pass, with a defect | Step 3 was pushed 6 s after CI passed on step 2. The merge for step 2's head was refused ("Pull Request is not mergeable"), nothing merged on the old SHA, and step 3's CI merged the PR. The refused attempt ended the run red, so `merge-passing-pr` now reports a moved head as a notice |

Defects found and fixed in this issue: the summary `Mode` line when detect-app fails, and the red run after a refused merge on a moved head. The probe branches and PR #80 were closed or merged and cleaned up.
