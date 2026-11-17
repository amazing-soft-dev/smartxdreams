# Earth backdrop

The Home hero's backdrop, split along the planet's oval limb:

- **Outside the limb (the sky):** the starfield of the Framer reference, recreated in `src/components/sky` (see [sky.md](sky.md)). It never reacts to the pointer.
- **Inside the limb (the Earth):** the painted Earth plate (`public/brand/earth`, with the SmartxDreams symbol in its clouds), animated as on generalcontextlabs.com: a slow drift, weather bands and a turning cyclone, and a fluid wake where a mouse moves over the planet, and only there.

Code lives in `src/components/earth`; the shared WebGL helpers are in `src/components/webgl`.

## Using it

Place `<EarthField />` inside a positioned container the size of the hero (on Home, `HomeHero`; see [Hero composition](#hero-composition-homehero-homecards)). It is decorative (`aria-hidden`); only the scene listens to the pointer, and only over the planet.

```tsx
<section className="relative isolate overflow-hidden">
  <EarthField />
  …
</section>
```

## Hero composition (`HomeHero`, `HomeCards`)

The Home hero fills the screen at every width (at least 100svh plus the 1 rem the cards band rises over it), so the band starts below the fold. It is laid out like the generalcontextlabs.com hero: the copy over the sky, the planet rising beside or below it, and nothing covering the SmartxDreams symbol in the clouds.

| Width | Hero | Copy | Planet and symbol |
|---|---|---|---|
| under 768 px | at least the viewport; copy height plus a band of min(88vw, 360 px) below it if that is taller | across the top | rises in the band below the copy; symbol 0.12 H, low on the right |
| 768–1023 px | at least the viewport | across the top | fills the lower half; symbol 0.22 H |
| 1024 px and up | at least the viewport, so its shape is the window's (4:3 to ultrawide) | left column (44vw, at most 620 px), centred vertically | rises from under the copy to the right edge; symbol 0.28 H at the bottom right |

- **Placement:** `PLATE_BREAKPOINTS` in `plate-layout.ts`. On desktop the plate sits low on the right: its left edge may start partway across the hero, since the planet along that edge is below the hero's bottom and only sky shows beside it (see [Placement](#placement-plate-layoutts)).
- **Scrim:** on desktop a soft radial wash of the sky's colour sits behind the copy column, so the sunrise and the limb's glow never cut the description's contrast.
- **Cards:** the six product mockups (`HeroWave`) live in `HomeCards`, a dark band right under the hero that rises 16 px over its bottom edge with rounded top corners, like the reference's page surface, so the planet runs under it instead of stopping at a hard line. It declares `data-nav-theme="dark"`.

`e2e/home-hero.spec.ts` checks, on desktop and mobile, that the headline, description and button never overlap the symbol, that the symbol is inside the hero and above the band, that the cards are in the band and not the hero, and that "How we build" still links to the process section. `plate-layout.test.ts` checks the placement over the hero shapes each breakpoint has to handle.

If you change the copy's length or the hero's padding, run both, and look at 375, 820 and 1475 px.

## How it loads

1. `EarthFallback` renders with the page: the starfield sky at once, and the plate, still, drawn into two canvases placed exactly where the scene will draw it, as soon as it has loaded.
2. `LazyScene` imports `EarthScene`, and three.js with it, only when `useSceneSupport` allows it, the hero is near the viewport, and the browser is idle. The scene loads the same plate variant, fades in over 700 ms once it is on screen, and is transparent outside the planet, so the fallback's sky stays the sky.
3. It never runs for reduced motion, data saver, low-power devices or missing WebGL 2: the still fallback stays.

`npm run check:bundle` (run in CI) keeps three.js out of the initial scripts of every route.

## Plate geometry

The backdrop is the painted Earth plate in `public/brand/earth` (see [brand.md](brand.md#earth-plate-publicbrandearth)). Two modules describe it, and the scene, the fallback and the pointer test all read them.

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
- **Elsewhere**, and until the texture has loaded: `uSky`, which is transparent, so the starfield sky in the fallback underneath shows through.

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

## Fallback (`EarthFallback.tsx`)

What shows without WebGL, and under the scene everywhere:

- **Sky:** `<StarfieldSky />`, filling the hero.
- **Plate:** two canvases, placed by `plateLayoutCss()` (`plateRect()` in CSS, container query units), into which the plate is drawn once it has loaded:
  - the planet: the plate clipped to the limb (`Path2D` of `horizonPath()`);
  - the glow: the plate kept inside a soft band reaching `GLOW_BAND` above the limb, blended with `screen`: the painted sky is black, so it adds nothing, and the glow lightens the stars behind it, as the shader's brightness-as-coverage does.
- **Variant:** `pickPlateVariant()` for the plate's device pixels (DPR capped at 2), loaded with the same CORS mode as three.js's loader, so the scene reuses the cached file. A resize that needs more loads a sharper one. The canvases never hold more pixels than the plate itself.

**Why canvases, not images:** a canvas is never a Largest Contentful Paint candidate. Drawn as an `<img>`, the large decorative plate became Home's LCP on a throttled phone (3.47 s in CI, over the 2.5 s budget), taking it from the description paragraph. With canvases the paragraph is the LCP again (`e2e/vitals.spec.ts`).

With the scene's canvas hidden, the fallback is indistinguishable from the scene. `e2e/earth.spec.ts` checks the sky and that both plate canvases are drawn, that reduced motion creates no scene canvas, stops the stars and still draws the plate, and that the scene fades in where WebGL 2 is available.

## Sharing the GPU

The Earth has the highest priority in `scene-budget.ts` (`earth: 3`), above the footer smoke, so when both are on screen only the hero draws. It pauses off-screen and in hidden tabs, and disposes its GPU resources on unmount (see [astrafield.md](astrafield.md#renderer-lifecycle) for the renderer lifecycle it shares). The starfield sky is SVG and CSS, not WebGL, so it never competes for the GPU budget..
