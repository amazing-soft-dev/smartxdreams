# Pipeline guide

How a change reaches production, and how to set the pipeline up.

## The path of a change

Two long-lived branches: `dev`, where work lands, and `main`, the release branch Vercel deploys. Nobody
pushes to either. A change lands through a pull request, as a merge commit, once **CI passed** is green.
No human review is required.

1. Open a GitHub issue and note its number.
2. Branch from `origin/dev` as `<feat|fix|docs|ci|build>/<issue>-<slug>`, for example `feat/12-short-description`.
3. Commit with Conventional Commit subjects. End the last commit with `Closes #12`.
4. Push. The three workflows do the rest:

| Workflow | File | What it does |
|---|---|---|
| Open pull request | `open-pull-request.yml` | A branch push opens its PR into `dev`, titled from the issue. A push to `dev` opens or updates `dev` → `main`, with a `Closes #N` line for every issue since `main` |
| CI | `ci.yml` | One job, **CI passed**, on every PR into `dev` or `main` (and by hand). A newer push cancels the older run |
| Merge passing pull request | `merge-passing-pr.yml` | After CI passes on a PR, merge-commits it if its head is still the commit CI checked. Eligible: a prefix branch into `dev`, `dev` into `main`, and Dependabot into `dev` |

The merge into `dev` pushes `dev`, which updates `dev` → `main`. That PR's CI run merges it into `main`, and
GitHub closes the listed issues. So a change gets **two CI runs**: its own PR, and the promotion PR. Pushes
to `dev` and `main` don't run CI, because the promotion PR has already checked that exact tree. Actions
never deploys: Vercel deploys `main` from its Git connection.

### What CI checks

One install, then the steps in order of cost, so a cheap failure ends the run early:

actionlint → lint → type check → unit tests → `check:images` → `check:brand` → server build →
`check:bundle` (page budgets, lazy three.js, Lenis and aurora) → Playwright on that build (smoke of every
page, axe, Home's throttled LCP and CLS) → static export (`images`, `NEXT_OUTPUT=export` build,
`verify:out`, no `out/api`).

Run the same locally before pushing: `npm run lint && npm run typecheck && npm test && npm run build &&
npm run check:bundle && npm run test:e2e`. Stop any old `next start -p 3400` first: Playwright reuses it.

### Dependabot

Dependabot (`.github/dependabot.yml`) opens weekly PRs into `dev` for npm and GitHub Actions. CI runs on them
like any PR. When it passes, the merge workflow merges the PR, but only if the PR and the commit CI
checked are both `dependabot[bot]`'s. A Dependabot branch someone else has pushed to waits for a person.

### Why `GH_TOKEN`, not `GITHUB_TOKEN`

Pull requests and merges made with the default `GITHUB_TOKEN` start no further workflow runs. The pipeline
needs a merge into `dev` to start the next step, so the open-PR and merge workflows use the **`GH_TOKEN`**
repository secret. `merge-passing-pr.yml` is a `workflow_run` workflow, which GitHub reads from `main`: a
change to it takes effect once it is on `main`.

## Owner setup (once)

1. Create a fine-grained personal access token for this repository: Contents, Pull requests, Issues and
   Workflows **Read and write**; Metadata Read. Save it as the repository secret **`GH_TOKEN`**.
2. Settings → Actions → General: allow GitHub Actions to create and approve pull requests; keep the default
   workflow permissions read-only.
3. Import both rulesets (needs GitHub Pro for a private repository):

   ```bash
   gh api repos/amazing-soft-dev/smartxdreams/rulesets --method POST --input .github/rulesets/dev.json
   gh api repos/amazing-soft-dev/smartxdreams/rulesets --method POST --input .github/rulesets/main.json
   ```

   Both block deletion and force-pushes, require a PR merged as a merge commit, and require **CI passed**,
   with no approving review and no bypass list.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every job fails in seconds with no steps: "recent account payments have failed or your spending limit needs to be increased" | Actions billing. Fix it under Billing & plans; nothing in the repository can |
| `gh api …/rulesets` answers "Upgrade to GitHub Pro" | The account is not on Pro, so the rulesets are not enforced |
| Open-PR or merge job fails on `gh` with no token | `GH_TOKEN` is missing or expired |
| No PR for a branch | The name is not `<prefix>/<number>-<slug>` |
| CI passed, but the PR was not merged | A newer commit was pushed (its run merges), the pair is not eligible, or a Dependabot branch has someone else's commit |
| A change to `merge-passing-pr.yml` has no effect | It is not on `main` yet |
| e2e fails locally on every JS-dependent page | An old `next start -p 3400` is still running |

The pipeline probes that proved each rule (issues #68 to #70) are recorded on those issues.
