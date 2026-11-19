# SmartxDreams

The company website for **SmartxDreams**, a studio that builds AI products for
everyday work and life.

> Status: the pages, the contact and waitlist forms and the delivery pipeline
> are in place. What is left before launch is listed in
> [docs/launch.md](docs/launch.md); work is tracked issue by issue on GitHub.

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
| `npm test` | Unit tests (Vitest, `src/**/*.test.ts`) |
| `npm run test:e2e` | Playwright against the production build: smoke test of every page, axe, Home's throttled LCP and CLS. Run `npm run build` first, and `npx playwright install chromium` once |
| `npm run check:bundle` | Fail if a built page exceeds its JavaScript, CSS or font budget (after `npm run build`; see [docs/performance.md](docs/performance.md)) |
| `npm run images` | Build responsive WebP variants of `public/images` into `public/_img` |
| `npm run check:images` | Fail unless every photo in `public/images` is used exactly once in `src/` |
| `npm run brand` | Build the logo, icon and product-logo files from the masters in `assets/` (see [docs/brand.md](docs/brand.md)) |
| `npm run check:brand` | Fail if one of those built files is missing or out of date |
| `npm run verify:out` | Check the static export in `out/` (pages, sitemap, icons, assets, image variants, no `out/api`) |

Before pushing, run the line below. CI runs these and a few more, listed in
[docs/pipeline.md](docs/pipeline.md#what-ci-checks).

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run check:bundle && npm run test:e2e
```

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack) with the React Compiler enabled |
| UI | React 19.3 |
| Language | TypeScript 7.0.2 in strict mode, `@/*` maps to `src/*` |
| Styling | Tailwind CSS 4.3 |
| Motion | Motion 14, Lenis for smooth scrolling, three.js for the WebGL backdrops |
| Lint | ESLint 10 with `eslint-config-next`, zero warnings allowed |
| Tests | Vitest 5 for unit tests, Playwright 1.65 with axe for end-to-end |

Versions are pinned exactly in `package.json`.

### Version notes

- **TypeScript 7.0.2 is the compiler** (`tsc` and Next). `typescript-eslint`
  8.72 cannot load TypeScript 7.0, which ships no JavaScript API, so
  `postinstall` points that package at `@typescript/typescript6` 6.0.2.
  Remove that link when `typescript-eslint` supports TypeScript 7.
- **ESLint 10 with older plugins.** `eslint-plugin-import` and
  `eslint-plugin-jsx-a11y` (pulled in by `eslint-config-next`) list ESLint 9 as
  their newest supported peer. Their rules were checked under ESLint 10, but
  watch for upstream updates.

## Project layout

```
src/app/         Routes, layouts and the /api handlers (App Router)
src/components/  Components, one folder per area (home, products, blog, nav, motion, ...)
src/content/     Copy and data: products, team, legal text, blog posts, the photo registry
src/lib/         Logic without UI: API helpers, forms, blog loader, SEO, redirects, security headers
e2e/             Playwright specs
scripts/         The build and check scripts behind the commands above
docs/            Guides, one per topic: pipeline, performance, brand, images, accessibility, launch, ...
assets/          Logo masters that are not served (see assets/README.md)
public/          Static assets: built logos and icon sets (see docs/brand.md), photos
next.config.ts   Next.js configuration
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
