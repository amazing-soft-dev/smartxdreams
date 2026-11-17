# Performance

Targets for Home on a throttled mobile run (Lighthouse defaults: simulated slow 4G, 4× CPU slowdown):
**LCP under 2.5 s, CLS under 0.05**. Field data comes from Vercel Speed Insights on the production deployment.

## Budgets (enforced in CI)

`npm run check:bundle` runs after the server build in the `Build (server)` job. It measures every
statically generated page (gzipped) and fails when any budget is exceeded:

| Budget | Limit | Now (2026-11-16) |
|---|---|---|
| Initial JavaScript per page | 330 KB | Home 305.1 KB, other pages about 288 KB |
| CSS per page | 30 KB | 13.4–13.8 KB |
| Preloaded fonts | 1 file, up to 60 KB | 1 Latin woff2, 44 KB |
| three.js (lazy chunk) | 200 KB | 131.2 KB |
| Not in initial scripts | three.js, Lenis, smoke shader | all lazy |

`npm run check:images` holds the photo budget: masters at most 2400 px, 800 KB each, 12 MB total.

## What loads when

- **Fonts:** Inter Tight variable, self-hosted, Latin subset preloaded. `display: swap` with a
  metric-matched fallback, so the swap does not shift text.
- **Lenis:** downloaded only on fine pointers without a reduced-motion preference.
- **Earth backdrop (three.js):** only on capable devices, when the hero is near the viewport and the browser
  is idle. Until then, and on other devices, a server-rendered CSS planet. The costly planet shader runs once
  per canvas size into a texture; each frame only draws that texture. See [earth.md](earth.md).
- **Footer smoke (WebGL):** requested only when the footer is within 600 px of the viewport, and paused
  off-screen. If the browser drops its WebGL context, it pauses and the static gradient shows; when the
  context comes back it rebuilds its shader program and carries on.
- **Photos:** responsive AVIF/WebP with intrinsic sizes and blur placeholders. Only the largest image
  above the fold uses `priority`.

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
if LCP reaches 2.5 s or CLS reaches 0.05, and runs in the "End-to-end (smoke and axe)" job.

**Lighthouse (before launch, for the full report):**

```bash
npm run build
npx next start -p 3200
npx lighthouse http://localhost:3200/ --only-categories=performance --view
```

Lighthouse's default mobile settings apply the throttling. Record the result here before launch, and repeat
for `/products/kinly` and a blog post.

| Date | Page | LCP | CLS | Notes |
|---|---|---|---|---|
| 2026-11-16 | `/` | 1.21–1.24 s | 0.000 | `e2e/vitals.spec.ts`, three runs on a local production build; LCP element: the hero paragraph |
| _pending_ | `/` | | | Lighthouse report on the deployed site |
