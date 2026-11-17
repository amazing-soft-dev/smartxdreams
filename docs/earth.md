# Earth backdrop

The Earth seen from orbit behind the Home hero, after the hero on generalcontextlabs.com. Everything is drawn by our own code (a procedural shader and CSS), so no third-party artwork ships with the site. Code lives in `src/components/earth`; the shared WebGL helpers are in `src/components/webgl`.

## Using it

Place `<EarthField />` inside a positioned, dark container. It is decorative (`aria-hidden`, no pointer events).

```tsx
<section className="relative isolate overflow-hidden bg-ink">
  <EarthField />
  …
</section>
```

`HomeHero` adds an ink scrim behind the copy, so the headline and description stay readable where clouds pass behind them.

## How it loads

1. `EarthFallback` (pure CSS) renders with the page: ink sky, an ocean-blue planet, its violet atmosphere and the coral sunrise. The hero is never empty.
2. `LazyScene` imports `EarthScene`, and three.js with it, only when `useSceneSupport` allows it, the hero is near the viewport, and the browser is idle.
3. It never runs for reduced motion, data saver, low-power devices or missing WebGL 2: the CSS planet stays.

`npm run check:bundle` (run in CI) keeps three.js out of the initial scripts of every route.

## Plate geometry

The backdrop is moving to the painted Earth plate in `public/brand/earth` (see [brand.md](brand.md#earth-plate-publicbrandearth)). Two modules describe it; the scene and the fallback switch to them in the follow-up issues, and the planet-circle layout below goes away.

### The plate (`plate.ts`)

Plate coordinates: `u` 0..1 left to right, `v` 0..1 top to bottom. The plate is 1774 × 887 px, twice as wide as tall.

- **Variants:** 768, 1200 and 1774 px WebP. `pickPlateVariant(pixels)` returns the narrowest at least that wide; `PLATE_SRCSET` lists them all.
- **Horizon:** the limb is an oval, so it is a cubic `v(u)` (`HORIZON`), fitted by `node scripts/measure-earth-plate.mjs` to where the blue atmosphere starts (192 of 222 columns, within 6 px over the full width). `horizonDistance(u, v)` is the signed distance in plate heights, positive on the planet and negative in the sky, measured across the curve so the steep left end and the flat right end read alike. `horizonPath()` is the planet's outline as an SVG path in plate pixels.
- **Landmarks** (measured by eye on the master, in `LANDMARKS`):

| Landmark | Plate px | Use |
|---|---|---|
| Sunrise | about (730, 285) | the hot point on the limb |
| Cyclone | eye about (1545, 262), spiral about 120 px | turns in place in the scene |
| Cloud symbol | about x 1065–1470, y 310–635 | placed per breakpoint; kept legible |

If the art changes, run the script, update `HORIZON`, re-measure the landmarks, and run `npm test`.

### Placement (`plate-layout.ts`)

Each breakpoint names where the cloud symbol's centre goes and how tall it is, in hero heights (H) from the bottom-left. `plateRect(target, aspect)` scales and moves the plate to put it there, then grows it about the symbol's centre just enough to cover the hero's left, right and bottom edges, so the planet is never cut off. Only the top can stay uncovered; above the plate is sky.

| From | Symbol centre (right, bottom) | Symbol height | Copy |
|---|---|---|---|
| 0 px (phone) | 0.2 H, 0.2 H | 0.16 H | across the top |
| 640 px (tablet) | 0.3 H, 0.25 H | 0.22 H | across the top |
| 1024 px (desktop) | 0.55 H, 0.48 H | 0.40 H | left column |

`heroToPlate()` and `plateToHero()` convert between hero and plate coordinates (the pointer test and the shader use them). `plateLayoutCss(selector)` writes the same placement for the fallback, with `plateRect()` itself in CSS (`--plate-height`, `--plate-left`, `--plate-bottom`, in container query units); in Chromium it matches `plateRect()` within 0.1 px.

`plate-layout.test.ts` checks every breakpoint over the hero shapes it must handle (tall phones, portrait to landscape tablets, a 1024 × 660 laptop up to an ultrawide): the plate covers the edges, the symbol is wholly on screen and on the planet, clear of the copy, and the cyclone's eye is on screen on desktop.

## The plate scene (`plate-shader.ts`, `EarthScene.tsx`)

`EarthScene` draws the painted plate in one full-screen pass. Every pixel is mapped into the plate with `uPlateRect` (from `plateRect()` for the breakpoint in force) and measured against the limb with the same cubic as `plate.ts`, generated into the GLSL from `HORIZON`:

- **On the planet:** the plate's colour, sampled where the motion says.
- **Just outside the limb** (`GLOW_BAND`, 0.06 plate heights): only the painted atmosphere glow, with its brightness as coverage (the painted sky is black), fading out across the band. This also drops the painted stars beyond it.
- **Elsewhere**, and until the texture has loaded: `uSky`. For now that is the hero's ink, so the old CSS planet underneath cannot show through; it becomes transparent once the starfield sky lies beneath the scene.

The texture is the narrowest WebP variant that covers the plate's device pixels (DPR capped at 2); a resize that needs more loads a sharper one. It is sampled as stored, without mipmaps or colour conversion. The canvas fades in over 700 ms once the plate is on screen.

### Motion

Motion moves where the plate is sampled, in plate heights (the limb distance's units), so the limb and its glow never move: it is off within `CALM_LIMB` (0.018) inside the limb, eases in by `FULL_MOTION` (0.065), and its travel is capped at half the distance to the calm band.

| Motion | Values | Where |
|---|---|---|
| Orbital drift | 12 px and 4.5 px on sines of 0.055 and 0.043 rad/s | everywhere on the planet |
| Weather bands | up to 28 px and 12 px, 0.22 and 0.18 rad/s | static noise patches, calmed over the cloud symbol |
| Cyclone | 0.19 rad plus a 0.035 rad overtone, 0.16 and 0.23 rad/s | around the painted eye, fading out past its reach |

The cloud symbol keeps its shape: the bands fade out over a soft ellipse around it, so it rides the orbital drift as one piece. `plate-shader.test.ts` checks that the generated GLSL uses `plate.ts`'s horizon and landmarks and that the bands suit the landmarks.

### Pointer wake (`fluid.ts`, `earth-pointer.ts`)

When a mouse moves over the Earth, and only the Earth, the painted plate flows under it like fluid and settles back, as on the reference. The sky never reacts.

- **Who stirs it** (`earth-pointer.ts`): a fine pointer that can hover (`(hover: hover) and (pointer: fine)`); not touch or coarse pointers; not over links, buttons, form fields, summaries or anything marked `data-earth-ignore`; and only over the planet, past the limb's still band (`isOnEarth()`). A long move is split into steps of at most 10 px (`splatCount()`), so a quick sweep leaves a continuous wake.
- **The fluid** (`fluid.ts`, our own implementation of Stam's stable fluids): a 128 × 64 grid over the canvas. Each step advects and damps the velocity, adds vorticity confinement, projects it divergence-free (20 Jacobi iterations, warm-started, with the two-cell Laplacian that matches the central differences), then carries a displacement field along the flow, feeds it, and lets it decay. Velocity is clamped to 45 cells/s and displacement to 8 cells, and a step is at most 1/30 s.
- **Feel:** a drag peaks at about 2.6 cells and is under a tenth of a cell 2.5 s later. On screen one cell moves the plate by `WAKE_GAIN` (0.35) of a cell's width, about 4 px on a 1460 px canvas, so a drag pushes the clouds up to about 10 px.
- **Cost:** the scene uploads the displacement as a 128 × 64 texture only while the wake moves; once the peak falls below 0.02 cells the solver resets and stops stepping.
- **Limb and symbol:** the wake joins the drift, weather and cyclone inside the same limb-safe motion, so the limb never moves. The cloud symbol is not calmed against it: its strands part and settle back.

Measured in Chromium as the mean pixel change over the cloud symbol: idle 0.89; after a sweep across the Earth 9.67; after a sweep across the sky 0.86 (no reaction); three seconds after an Earth sweep, within about one of the ambient drift over the same time.

## Layout

`layout.ts` places the planet per breakpoint (`EARTH_BREAKPOINTS`), the way a designer would: the height where the limb meets the hero's right edge (`edgeY`), how far from the right edge it meets the bottom (`baseX`), and how far past the right edge the centre sits (`overhang`). `planetCircle()` solves that into a centre and radius. Each breakpoint also names the limb angle where the sun rises (`sunAngle`, degrees counter-clockwise from "right").

All lengths are in hero heights (H) from the hero's bottom-right corner, so the planet keeps its shape at any hero height and a wider screen only adds sky on the left.

| From | Planet | Sunrise | Cloud symbol | Cyclone |
|---|---|---|---|---|
| 0 px (phone) | low, wide arc under the description and behind the button | just past the right edge | small, right of the button, above the cards | behind the cards |
| 640 px (tablet) | rises from the lower left to the top right | upper right | bottom right, below the cards | bottom middle, below the cards |
| 1024 px (desktop) | from the bottom middle to above the top right | under the header | right of the headline, above the cards | top right, above the symbol |

The scene reads the breakpoint from `window.innerWidth`; the fallback gets the same numbers as custom properties from `earthLayoutCss()` and positions itself with container query units (`100cqh` is one hero height). Change the table in one place and both follow. `layout.test.ts` checks the geometry.

## What it draws

`planetFragmentShader` in `earth-shader.ts`:

- **Sky:** ink (`#0F1226`) turning deep blue toward the planet, sparse fixed stars.
- **Planet:** a sphere shaded from its view-space normal. Warped fractal noise gives coasts, shallow shelves, green and dry land and polar ice; broad cloud systems are broken up by smaller cumulus. Noise stretched along the meridians reads as brush strokes.
- **Light:** daylight from the sun direction, a small glint on open water, and an atmosphere that thickens toward the limb.
- **Limb:** a halo and painted wisps, violet (`violet-400`) away from the sun and coral (`coral-400`) to dawn toward it, and the hot point of the sun about to rise.

## The cloud symbol

Where the reference draws its own logo in clouds, we draw the SmartxDreams symbol: the S and the D as two woven strands of cloud at the bottom right of the planet.

- **Shape:** the geometry is shared with the `Logo` component through `src/lib/brand-symbol.ts`, so the cloud symbol is always the brand mark, crossings included. Never copy the paths.
- **Mask:** `drawSymbolMask()` (`symbol-mask.ts`) draws it once into a 256 px texture: each strand twice the logo's stroke width, cut where the other strand passes over it, blurred into a soft falloff. The S is in the red channel and the D in the green.
- **Cloud:** `composeFragmentShader` swells and thins the strands with noise (broad lumps, cumulus puffs, fine wisps), lights each strand on its sunward side by checking how much cloud lies toward the sun, keeps thick cores bright, lets thin edges show the ocean, and darkens the ocean under it as a cast shadow. It draws only on the planet and fades out just inside the limb.
- **Placement:** `symbol` in each breakpoint: centre (`right`, `bottom`) and artwork `height` in H, and a `tilt` in degrees. It is foreshortened (0.86) to lie on the globe. `symbol-placement.test.ts` checks it stays on the planet, inside the right edge, and clear of the desktop headline and cards.
- **Fallback:** `CloudSymbol` draws the same strands as SVG, roughened with `feTurbulence` and blurred, in the same place from the `--earth-symbol-*` properties.

If you move the symbol, check it at 375, 820 and 1475 px: the copy and the product cards sit on top of the backdrop and must not cover it.

## Motion

All motion happens in `composeFragmentShader` by moving where the baked picture is sampled; the planet is never re-baked to animate. Values follow the reference.

| Motion | What moves | Values |
|---|---|---|
| Orbital drift | the whole globe | 12 px and 4.5 px on sines of 0.055 and 0.043 rad/s |
| Weather bands | broad flow across a few static patches of weather | up to 28 px and 12 px, 0.22 and 0.18 rad/s |
| Cyclone | turns back and forth in place, most at its heart | 0.19 rad plus a 0.035 rad overtone, 0.16 and 0.23 rad/s |
| Pointer wake | the plate under a moving mouse, over the Earth only | a stable-fluid simulation; see [Pointer wake](#pointer-wake-fluidts-earth-pointerts) |

- **The limb never moves.** Motion is off within 0.018 H of the limb, eases in to full strength by 0.065 H, and its travel is capped at half the distance to that band, so no sky or glow is ever pulled across it. The copy never moves either: it is not part of the canvas.
- **The cloud symbol** rides the weather at its centre as one piece (the bands would otherwise bend the S and D out of shape), but the wake does part its strands, which then settle back.
- **Pointer wake** is only for `(hover: hover) and (pointer: fine)`; touch and coarse pointers get none. Listeners are passive and removed with the scene.
- **Fade in:** the canvas fades in over 700 ms over the CSS planet once its first frame is drawn.
- **Reduced motion:** the scene never loads and the static CSS planet with its cloud symbol stays. Switching reduced motion on while the page is open unmounts the scene. Time stops while the scene is off-screen or the tab is hidden, and picks up where it left off.

`e2e/earth.spec.ts` checks that the CSS planet and symbol paint first, that reduced motion never loads the scene, and that the scene fades in where WebGL 2 is available.

## Cost

The planet shader runs a few dozen noise lookups per pixel, so `EarthScene` renders it into a render target once per canvas size (the "bake") and only draws that texture each frame. It bakes again after a resize, a breakpoint change, or a restored WebGL context, since a lost context takes the render target's contents with it.

## Sharing the GPU

The Earth has the highest priority in `scene-budget.ts` (`earth: 3`), above the footer smoke, so when both are on screen only the hero draws. It pauses off-screen and in hidden tabs, and disposes its GPU resources on unmount (see [astrafield.md](astrafield.md#renderer-lifecycle) for the renderer lifecycle it shares).
