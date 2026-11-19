# Performance

Targets for Home on a throttled mobile run (Lighthouse defaults: simulated slow 4G, 4× CPU slowdown):
**LCP under 2.5 s, CLS under 0.05**. Field data comes from Vercel Speed Insights on the production deployment.

## Budgets (enforced in CI)

`npm run check:bundle` runs after the server build in the `Build (server)` job. It measures every
statically generated page (gzipped) and fails when any budget is exceeded:

| Budget | Limit | Now (2026-11-16) |
|---|---|---|
| Initial JavaScript per page | 340 KB | Home 331.6 KB, other pages about 308 KB (2026-11-18, with the motion work #380–#391) |
| CSS per page | 30 KB | 13.4–13.8 KB |
| Preloaded fonts | 1 file, up to 60 KB | 1 Latin woff2, 44 KB |
| three.js (lazy chunk) | 200 KB | 131.2 KB |
| Not in initial scripts | three.js, Lenis, aurora shader | all lazy |

`npm run check:images` holds the photo budget: masters at most 2400 px, 800 KB each, 12 MB total.

## What loads when

- **Fonts:** Inter Tight variable, self-hosted, Latin subset preloaded. `display: swap` with a
  metric-matched fallback, so the swap does not shift text.
- **Lenis:** downloaded only on fine pointers without a reduced-motion preference.
- **Earth backdrop (three.js):** only on capable devices, when the hero is near the viewport and the browser
  is idle. Until then, and on other devices, a server-rendered still version: the SVG starfield, and the
  painted plate drawn on canvas (768 / 1200 / 1659 px WebP, picked like the scene's and shared with it; a
  canvas is never the LCP, so the plate cannot take it from the text). The fluid wake steps
  on the CPU only while it moves. See [earth.md](earth.md).
- **Footer aurora (WebGL):** requested only when the footer is within 600 px of the viewport, drawn at
  half resolution, and paused off-screen. If the browser drops its WebGL context, it pauses and the still
  CSS aurora shows; when the context comes back it rebuilds its shader program and carries on. The
  footer's drifting stars are box-shadows on three elements, moved by compositor-only transforms, with
  no JavaScript.
- **Photos:** responsive WebP (the Next.js default; `next.config.ts` sets no `images.formats`) with
  intrinsic sizes and blur placeholders. Only the largest image above the fold uses `priority`.

## Layout-shift safeguards

- Every photo reserves its box (width and height, or a fixed aspect ratio with `fill`).
- Fonts swap onto a fallback sized to Inter Tight's metrics.
- Scroll reveals and hover effects animate `transform` and `opacity` only, never layout.
- Server-rendered fallbacks for the filtered lists (products, blog) and the contact form reserve the same
  space as the hydrated versions.
- The typed word in the call to action reserves one line, so typing never re-wraps the heading.

## Checking LCP and CLS

**In any browser:** add `?vitals` to a URL (for example `/?vitals`) and open the console.
`VitalsReporter` logs LCP with its element, CLS with the elements behind each shift, and INP. It is always
on in `npm run dev`.

**Throttled run in CI:** `e2e/vitals.spec.ts` loads Home on the phone profile with Lighthouse's mobile
throttling applied through the DevTools Protocol (150 ms latency, 1.6 Mbps down, 4× CPU slowdown). It fails
if LCP reaches 2.5 s or CLS reaches 0.05. It runs in CI's one job, "CI passed", after every other
Playwright test has finished (see [pipeline.md](pipeline.md#what-ci-checks)).

**Lighthouse (before launch, for the full report):**

```bash
npm run build
npx next start -p 3200
npx lighthouse http://localhost:3200/ --only-categories=performance --view
```

Lighthouse's default mobile settings apply the throttling. Record the result here before launch, and repeat
for `/products/senioraiplans` and a blog post.

| Date | Page | LCP | CLS | Notes |
|---|---|---|---|---|
| 2026-11-16 | `/` | 1.21–1.24 s | 0.000 | `e2e/vitals.spec.ts`, three runs on a local production build; LCP element: the hero paragraph |
| 2026-11-18 | `/` | 1.65–1.72 s | 0.000 | `e2e/vitals.spec.ts`, three runs on a local production build of `7b530ac`; LCP element: the hero paragraph |
| _pending_ | `/` | | | Lighthouse report on the deployed site |
