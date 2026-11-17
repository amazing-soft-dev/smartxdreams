# SmartxDreams

The company website for **SmartxDreams**, a studio that builds AI products for
everyday work and life.

> Status: early scaffold. The site is being built issue by issue; see the
> open issues on GitHub for the roadmap.

## Quickstart

Requirements: a current Node.js release and npm (developed on Node 26).

```bash
npm ci          # install exact versions from package-lock.json
npm run dev     # start the dev server on http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `NEXT_OUTPUT=export npm run build` | Static export into `out/` (no server, no `/api`); CI builds this too |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint, any warning fails the run |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run images` | Build responsive WebP variants of `public/images` into `public/_img` |
| `npm run check:images` | Fail unless every photo in `public/images` is used exactly once in `src/` |
| `npm run verify:out` | Check the static export in `out/` (pages, sitemap, icons, assets, image variants, no `out/api`) |

Run `npm run lint`, `npm run typecheck` and `npm run build` before pushing.

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack) with the React Compiler enabled |
| UI | React 19.3 |
| Language | TypeScript 6.0 in strict mode, `@/*` maps to `src/*` |
| Lint | ESLint 10 with `eslint-config-next`, zero warnings allowed |

Versions are pinned exactly in `package.json`.

### Version notes

- **TypeScript 6.0.3, not 7.** `typescript-eslint` 8.72 supports TypeScript
  below 6.1.0. Move to TypeScript 7 once `typescript-eslint` supports it.
- **ESLint 10 with older plugins.** `eslint-plugin-import` and
  `eslint-plugin-jsx-a11y` (pulled in by `eslint-config-next`) list ESLint 9 as
  their newest supported peer. Their rules were checked under ESLint 10, but
  watch for upstream updates.

## Project layout

```
src/app/        Routes and layouts (App Router)
public/         Static assets: brand symbol and icon sets (see docs/brand.md), photos
next.config.ts  Next.js configuration
```

## Contributing

Work is tracked in GitHub issues. Each issue gets its own branch from `dev`,
named with the issue number first, for example `feat/12-short-description`
(allowed prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `build/`). Commits use
Conventional Commit subjects such as `feat(home): short description`.
Do not push directly to `dev` or `main`; changes land through pull requests.
See [docs/pipeline.md](docs/pipeline.md) for how a pushed branch becomes a
pull request, passes CI and is merged automatically.

## License

Apache License 2.0, see [LICENSE](LICENSE).
