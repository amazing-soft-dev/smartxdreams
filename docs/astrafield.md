# AstraField

The star-field behind the Home hero. Code lives in `src/components/astra` (scene) and `src/components/webgl` (shared WebGL helpers).

## Using it

Place `<AstraField />` inside a positioned, dark container. It is decorative (`aria-hidden`, no pointer events).

```tsx
<section className="relative isolate overflow-hidden bg-ink">
  <AstraField />
  …
</section>
```

## How it loads

1. `StarFallback` (pure CSS stars) renders with the page, so the hero is never empty.
2. `LazyScene` imports `AstraScene`, and three.js with it, only when `useSceneSupport` allows it, the hero is near the viewport, and the browser is idle.
3. It never runs for reduced motion, data saver, low-power devices (2 cores or 2 GB or fewer) or missing WebGL. Switching reduced motion on while the page is open removes the scene.

`npm run check:bundle` (run in CI) keeps three.js out of the initial Home scripts and under 200 KB gzipped.

## What it draws

- About 5,000 stars from a fixed seed (same sky on every visit): mostly white, some violet-300 and coral-300, twinkling, fading with depth, drifting slowly.
- Damped pointer parallax on fine pointers.
- Six constellations, one per product (`constellations.ts`). Any element with `data-product="<slug>"` lights up that product's constellation on hover or keyboard focus, and dims the rest. The product cards on Home carry it.

## Sharing the GPU

`scene-budget.ts` lets only the highest-priority visible scene draw: the stars (priority 2) outrank the footer smoke (priority 1). Hidden or off-screen scenes pause, and every scene disposes its GPU resources on unmount.
