# Contributing

Every change goes through a GitHub issue, its own branch and an automatic pull request. Nobody pushes to `dev` or `main`; the rulesets reject it. See [docs/pipeline.md](docs/pipeline.md) for how the workflows work.

## 1. Start from an issue

Open or pick an issue and note its number. Issues use the **Task** template: goal, planned commits, acceptance criteria, dependencies and what is out of scope.

One issue, one branch. The `dev` → `main` pull request closes an issue when any merged branch carries its number, so do not split an issue across several branches.

## 2. Branch from `origin/dev`

```bash
git fetch origin
git switch -c feat/12-short-description origin/dev
```

Name: `<prefix>/<issue-number>-<short-slug>`. Allowed prefixes:

| Prefix | Use for |
|---|---|
| `feat/` | Features, UI, content, tests |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `ci/` | Workflows and pipeline |
| `build/` | Dependencies, build and tooling |

Any other name is ignored by the pipeline: no pull request is opened.

## 3. Commit

Use [Conventional Commit](https://www.conventionalcommits.org/) subjects with a scope:

```
feat(home): hero with selection-box headline
```

Write a body that says what changed and why. Keep commits small and focused; an issue usually has three to six. End the **last** commit with `Closes #12` (optional when the branch name has the number).

Every commit ends with these co-author trailers, after a blank line:

```
Co-authored-by: shark314 <112891100+shark314@users.noreply.github.com>
Co-authored-by: tomost8 <178904341+tomost8@users.noreply.github.com>
```

## 4. Check locally before pushing

```bash
npm run lint          # zero warnings allowed
npm run typecheck
npm run check:images  # each photo used once
npm run build
NEXT_OUTPUT=export npm run build && npm run verify:out
```

## 5. Push

```bash
git push -u origin feat/12-short-description
```

The pipeline opens a pull request into `dev`, runs CI, and merges it as a merge commit when **CI passed** is green. The merge then opens or updates `dev` → `main`, which merges the same way. No human review is required; CI is the gate.

If CI fails, push a fix to the same branch. A newer push cancels the older run.

## Code conventions

- Copy lives in `src/content`, not in components.
- Visual size comes from type tokens (`text-display`, `text-h2`, …), never from the heading level. One `<h1>` per page at every width.
- Every animation respects `prefers-reduced-motion`; hover-only effects are gated by `(hover: hover) and (pointer: fine)`.
- Coral buttons use ink text. See [docs/design-tokens.md](docs/design-tokens.md) for the contrast rules.
- Photos go in `public/images` and are referenced exactly once; see the image scripts in the README.
