# AstraField

The star-field that sat behind the Home hero until the [Earth backdrop](earth.md) replaced it. It is no longer mounted on any page; the scene and its constellations are kept for reuse. Code lives in `src/components/astra` (scene) and `src/components/webgl` (shared WebGL helpers).

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
3. It never runs for reduced motion, data saver, low-power devices (2 cores or 2 GB or fewer) or missing WebGL 2. three.js supports WebGL 2 only, so a browser with WebGL 1 alone keeps the CSS stars and never downloads three.js. Switching reduced motion on while the page is open removes the scene.

`npm run check:bundle` (run in CI) keeps three.js out of the initial Home scripts and under 200 KB gzipped.

## What it draws

- About 5,000 stars from a fixed seed (same sky on every visit): mostly white, some violet-300 and coral-300, twinkling, fading with depth, drifting slowly.
- Damped pointer parallax on fine pointers.
- Six constellations, one per product (`constellations.ts`). Any element with `data-product="<slug>"` lights up that product's constellation on hover or keyboard focus, and dims the rest. The product cards on Home carry it.

## Sharing the GPU

`scene-budget.ts` lets only the highest-priority visible scene draw: the stars (priority 2) outrank the footer aurora (priority 1). Hidden or off-screen scenes pause, and every scene disposes its GPU resources on unmount.

## Renderer lifecycle

`useThreeRenderer(hostRef, setup, budget)` creates its own `<canvas>` inside the host element on every mount and removes it on unmount, after `forceContextLoss()` has released the context. Do not hand it a React-rendered canvas: a canvas keeps its first context for life, even once lost, and React reuses the node across Strict Mode's double mount in development (and `<Activity>`), so the second mount would get a dead context and three.js would throw `Cannot read properties of null (reading 'precision')`.

Before creating the renderer it asks for a WebGL 2 context itself (`getLiveWebGL2Context` in `webgl-context.ts`). No context, or one that is already lost, means the canvas is removed and the CSS fallback stays, with nothing logged. If the browser drops the context later (GPU reset, too many live contexts, a backgrounded mobile tab), the loop pauses and the fallback shows through. On restore three.js rebuilds its state and the loop picks up again. To try it, run this in devtools on Home:

```js
const ext = document.querySelector("canvas[data-engine]").getContext("webgl2").getExtension("WEBGL_lose_context");
ext.loseContext(); // stars stop and the CSS stars show
ext.restoreContext(); // stars come back
```
