# Earth backdrop

The Home hero's backdrop, split along the planet's oval limb:

- **Outside the limb (the sky):** the starfield of the Framer reference, recreated in `src/components/sky` (see [sky.md](sky.md)), with only the painted atmosphere (rim, sunrise, high streaks) crossing the limb into it. It never reacts to the pointer.
- **Inside the limb (the Earth):** the painted Earth plate (`public/brand/earth`, the Cloud-Formed Emblem art, with the SmartxDreams emblem in its clouds), animated as on generalcontextlabs.com: a slow drift, weather bands, curling ambient currents and a cyclone that turns and breathes around its eye, and a fluid wake where a mouse moves over the planet, and only there.

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

The Home hero fills the screen at every resolution (at least 100svh plus the 28 or 36 px the cards band rises over it), so the band starts below the fold. It is laid out like the generalcontextlabs.com hero: the copy over the sky, the planet rising beside or below it, and nothing covering the SmartxDreams emblem in the clouds.

| Window | Hero | Copy | Planet and emblem |
|---|---|---|---|
| phone, under 640 px | at least the viewport; copy height plus a band of min(88vw, 360 px) below it if that is taller | across the top | rises in the band below the copy; emblem 0.14 H, nearly all inside the first screen |
| tablet, 640–1023 px (and 1024 px and up held upright) | at least the viewport | across the top | fills the lower half; emblem 0.3 H |
| landscape phone, 640–1023 px and at least 1.6:1 (`landscape-phone` variant) | at least the viewport | left column (52vw), centred, smaller headline (clamp(1.75rem, 9svh, 2.5rem)) | rises on the right; emblem 0.3 H |
| desktop, 1024 px and up in a landscape window (`desktop` variant) | at least the viewport, so its shape is the window's (5:4 to 21:9) | left column (44vw, at most 620 px; from 1800 px, 40vw up to 860 px), centred vertically | rises from under the copy to the right edge; emblem 0.3 H, 0.34 H from 2.2:1, 0.44 H from 2.9:1 |

- **Placement:** `PLATE_BREAKPOINTS` in `plate-layout.ts`, picked by width and aspect. On desktop the plate sits low on the right: its left edge may start partway across the hero, since the planet along that edge is below the hero's bottom and only sky shows beside it (see [Placement](#placement-plate-layoutts)).
- **Variants:** `landscape-phone` and `desktop` are custom variants in `globals.css`, with the same media queries as the plate breakpoints of the same names, so the copy and the planet always change layout together.
- **Type:** from 1024 px the headline is clamp(2.5rem, min(1.6rem + 3.2vw, 7.4svh), 5.5rem): it follows the window's height too, so a short laptop's copy clears the limb (44 px at 1280 × 600) and a 1440p window gets 88 px. From 1800 px the description is 21 px.
- **Scrim:** on desktop and landscape phones a soft radial wash of the sky's colour sits behind the copy column, so the sunrise and the limb's glow never cut the description's contrast.
- **Cards:** the six product mockups (`HeroWave`) live in `HomeCards`, a dark band right under the hero that rises over its bottom edge by exactly its corner radius (28 px, 36 px from md), like the reference's page surface, so its corners show the hero, never the page background, and the planet runs under it instead of stopping at a hard line. The backdrop is placed against the visible hero, above that strip (`EarthField` stops 28 or 36 px short of the hero's bottom), and the plate runs on into it. It declares `data-nav-theme="dark"`.

`e2e/home-hero.spec.ts` checks, on a phone and on eleven windows from 915 × 412 and an upright 1024 × 1366 to 3440 × 1440 and 5120 × 1440, that the hero fills the screen with the band below the fold and no sideways scroll, that the emblem is on screen, above the band and clear of the headline and description; and that the button never overlaps the emblem, that the cards are in the band and not the hero, and that "How we build" still links to the process section. `plate-layout.test.ts` checks the placement over the hero shapes each breakpoint has to handle and over 24 real windows (see [Placement](#placement-plate-layoutts)).

If you change the copy's length or the hero's padding, run both, and look at 390 × 844, 915 × 412, 820 × 1180, 1280 × 600, 1475 × 830 and 2560 × 1440.

## How it loads

1. `EarthFallback` renders with the page: the starfield sky at once, and the plate, still, drawn into two canvases placed exactly where the scene will draw it, as soon as it has loaded.
2. `LazyScene` imports `EarthScene`, and three.js with it, only when `useSceneSupport` allows it, the hero is near the viewport, and the browser is idle. The scene loads the same plate variant, fades in over 700 ms once it is on screen, and is transparent outside the planet, so the fallback's sky stays the sky.
3. It never runs for reduced motion, data saver, low-power devices or missing WebGL 2: the still fallback stays.

`npm run check:bundle` (run in CI) keeps three.js out of the initial scripts of every route.

## Plate geometry

The backdrop is the painted Earth plate in `public/brand/earth` (see [brand.md](brand.md#earth-plate-publicbrandearth)). Two modules describe it, and the scene, the fallback and the pointer test all read them.

### The plate (`plate.ts`)

Plate coordinates: `u` 0..1 left to right, `v` 0..1 top to bottom. The plate is the Cloud-Formed Emblem art, 1659 × 948 px (1.75:1, `PLATE_ASPECT`).

- **Variants:** 768, 1200 and 1659 px WebP (`PLATE_VARIANTS`), built by `node scripts/build-earth-plate.mjs`. `pickPlateVariant(pixels)` returns the narrowest at least that wide, or the master above that.
- **Horizon:** the limb is an oval, so it is a cubic `v(u)` (`HORIZON`), fitted by `node scripts/measure-earth-plate.mjs` to where the bright blue rim starts: 130 of 145 columns from 40 to 1656 px, within 8.5 px. The art's navy sky is already faintly blue up to 80 px above the rim, so the script looks for bright blue (above 185, at least red), and it skips the columns from 460 to 960 px where the sun's glare hides the rim. `horizonDistance(u, v)` is the signed distance in plate heights, positive on the planet and negative in the sky, measured across the curve so the steep left end and the flat right end read alike. `horizonPath()` is the planet's outline as an SVG path in plate pixels.
- **Landmarks** (measured by eye on the master, in `LANDMARKS`):

| Landmark | Plate px | Use |
|---|---|---|
| Sunrise | about (688, 345), just inside the limb | the hot point on the limb |
| Cyclone | eye about (1458, 292); painted arms about 190 px (the reach) | turns and breathes around its eye in the scene |
| Cloud emblem | about x 1005–1540, y 355–650 | placed per breakpoint; kept legible |

The emblem's upper stroke passes only about 100 px from the eye, inside the cyclone's reach. The **emblem mask** (`EMBLEM_MASK_SRC`, `public/brand/earth/earth-emblem-mask.png`, 415 × 237) keeps the storm's motion off it: white on the emblem's two cloud strokes (traced as centre lines in `scripts/build-earth-plate.mjs`, the inner hook and the outer C, with about 8 px of margin and a soft edge), black elsewhere. The script builds it with the variants.

If the art changes, run both scripts, update `PLATE`, `HORIZON` and the landmarks, and run `npm test`.

### Placement (`plate-layout.ts`)

Each breakpoint names where the cloud emblem's centre goes and how tall it is, in hero heights (H) from the bottom-left. `plateRect(target, aspect)` scales and moves the plate to put it there, then grows it about the emblem's centre just enough to cover the hero's left, right and bottom edges, so the planet is never cut off. Only the top can stay uncovered; above the plate is sky.

Breakpoints match by viewport width and, for some, aspect (`minAspect`, width / height), in cascade order: the last one that matches wins, in the scene (`plateBreakpointFor(innerWidth, innerHeight)`) as in the fallback's media queries (`plateMediaQuery()`).

| Name | Matches from | Emblem centre (right, bottom) | Emblem height | Copy |
|---|---|---|---|---|
| phone | 0 px | 0.17 H, 0.17 H | 0.14 H | across the top |
| tablet | 640 px | 0.3 H, 0.18 H | 0.3 H | across the top |
| landscape phone | 640 px and 1.6:1 | 0.36 H, 0.22 H | 0.3 H | left column |
| desktop | 1024 px and 1:1 | 0.3 H, 0.2 H | 0.3 H | left column |
| wide | 1024 px and 2.2:1 | 0.34 H, 0.2 H | 0.34 H | left column |
| ultrawide | 1024 px and 2.9:1 | 0.44 H, 0.3 H | 0.44 H | left column |

The emblem is about 1.8 times as wide as it is tall, so at 0.3 H it spans about 0.54 H. A tablet held upright at 1024 px or wider is under 1:1, so it keeps the tablet placement and layout.

`heroToPlate()` and `plateToHero()` convert between hero and plate coordinates (the pointer test and the shader use them). `plateLayoutCss(selector)` writes the same placement for the fallback, with `plateRect()` itself in CSS (`--plate-height`, `--plate-left`, `--plate-bottom`, in container query units); in Chromium it matches `plateRect()` within 0.1 px.

`plate-layout.test.ts` runs one set of checks over the hero shapes each breakpoint must handle and over 24 real windows, from a 360 × 780 phone to a 5120 × 1440 monitor: the plate covers the edges, the emblem is wholly on screen and on the planet, out of the copy column (or below copy that runs across the top), the cyclone's eye is on screen where the copy is a column, and the limb passes under the desktop copy column. It also checks which breakpoint each kind of window gets.

## The plate scene (`plate-shader.ts`, `EarthScene.tsx`)

`EarthScene` draws the painted plate in one full-screen pass. Every pixel is mapped into the plate with `uPlateRect` (from `plateRect()` for the breakpoint in force) and measured against the limb with the same cubic as `plate.ts`, generated into the GLSL from `HORIZON`:

- **On the planet:** the plate's colour, sampled where the motion says.
- **Just outside the limb** (`GLOW_BAND`, 0.12 plate heights): only the painted atmosphere glow (see [The limb between sky and Earth](#the-limb-between-sky-and-earth)), fading out across the band. This also drops the painted stars beyond it.
- **Elsewhere**, and until the texture has loaded: `uSky`, which is transparent, so the starfield sky in the fallback underneath shows through.

### The limb between sky and Earth

The hero is split along the planet's round limb: the Framer starfield on the start side, the Earth on the end side. What crosses the limb into the sky is only the painted atmosphere: the bright cyan rim and its halo, the sunrise, and the thin streaks of high cloud the art paints over the limb between the sunrise and the cyclone.

- **Coverage** (`glowCoverage()` in `plate.ts`, and the same in the shader): the painted sky is navy, near 0 in red and under 0.1 in green away from the planet, and only its blue rises in the haze over the rim. The rim (0.35-0.45 within 12 px), the sunrise (0.6-0.75) and the streaks (about 0.25 at 40 px out) are bright in red or green. So the glow's coverage is how far the brighter of red and green rises above `SKY_FLOOR` (0.1), opaque at `SKY_FLOOR + GLOW_RISE` (0.45). Counting blue too, as a black-sky plate allowed, would lay the navy haze over the starfield as a veil.
- **Band** (`glowFade()`): kept whole within `GLOW_EDGE` (0.008) of the limb, faded out by `GLOW_BAND` (0.12), far enough for the streaks, which reach about 0.115.
- **Colour:** as painted, at that coverage (premultiplied over the transparent sky), so the sky beneath shows through the thin parts.

The CSS fallback masks its glow canvas on the CPU with the same two functions (`maskGlow()` in `glow-mask.ts`), so with the scene's canvas hidden the limb is the same. `glow-mask.test.ts` and `plate-shader.test.ts` check the navy sky gets no glow, the rim and streaks do, the fade, and that the shader carries the same constants.

The texture is the narrowest WebP variant that covers the plate's device pixels (DPR capped at 2); a resize that needs more loads a sharper one. It is sampled as stored, without mipmaps or colour conversion. The canvas fades in over 700 ms once the plate is on screen.

### Motion

Motion moves where the plate is sampled, in plate heights (the limb distance's units), so the limb and its glow never move: it is off within `CALM_LIMB` (0.018) inside the limb, eases in by `FULL_MOTION` (0.065), and its travel is capped at half the distance to the calm band (`limbSafe()`). Pixels in the calm band or outside the limb skip the motion altogether.

| Motion | Values | Where |
|---|---|---|
| Orbital drift | 12 px and 4.5 px on sines of 0.055 and 0.043 rad/s | everywhere on the planet |
| Weather bands | up to 28 px and 12 px, 0.22 and 0.18 rad/s | static noise patches, calmed over the cloud emblem |
| Ambient currents | curl noise, up to about 13 px (4 px on average), drifting across the planet and slowly changing | everywhere on the planet; the emblem rides them whole |
| Cyclone turn | counter-clockwise (as seen): 0.16 rad/s inside a 28 px core, then the same speed along every ring; clouds drifting in at 3.3 px/s | the painted spiral, 190 px around the eye; not the emblem |
| Cyclone breath | in toward the eye and back out, 11 px each way, every 9 s | the same, the eye itself still |

(px are master pixels; on screen they scale with the plate.)

**Ambient flow:** with no pointer the Earth still flows, as on the reference: the clouds stream along broad, curling currents. The plate is displaced by the curl of a smooth noise field, a stream function (`currents()`, mirrored by `currentsAt()`), so the flow is divergence-free: clouds stream and curl past each other without bunching up or thinning out. The field is broad (`CURRENT_SCALE`, 2.2 noise cells per plate height), drifts across the planet (`CURRENT_DRIFT`) and slowly changes in place (`CURRENT_EVOLVE`), so the currents travel and turn instead of repeating. The displacement is bounded (`CURRENT_STRENGTH`; the curl peaks near 2.7), so after minutes nothing has smeared, and it is one sample, with no crossfade to ghost. `currents.test.ts` checks it is divergence-free, bounded at any time, a few pixels in size and changing within seconds, and that the shader carries the same field.

**The emblem keeps its shape:** read pixel by pixel, the weather and the currents would bend its strokes apart. `emblemWhole()` is the larger of a soft ellipse around the emblem (`symbolCalm()`, a wide, gentle blend over the open ocean around it) and the emblem mask (so the tail and the outer C's ends, which reach past the ellipse, are covered too). Over the emblem the weather is calmed by that weight and the currents are blended toward the currents at its centre (`emblemSafeCurrents()`), so it drifts with the flow around it as one piece while the clouds around it stream. In headless Chromium, over 8 s the emblem moved about 3 px and, with that shift taken out, its pixels changed by about 3 of 255.

`plate-shader.test.ts` checks that the generated GLSL uses `plate.ts`'s horizon and landmarks and that the bands suit the landmarks.

**How the cyclone moves:** clouds go round one point, the eye, and toward it, as in a storm seen from orbit.

- **Turn and inflow:** a real storm turns one way and its bands spiral in, so the cyclone spins continuously instead of rocking. Turning the picture without end would wind the spiral tighter forever, so, as flow-map water shaders do, two layers swirl the plate half a 3 s cycle apart (`CYCLONE_CYCLE`): each turns a small, bounded amount from the middle of its cycle, and they are crossfaded with weights 1 - |2p - 1| (`swirlLayers()` mirrors them) so neither restart shows.
- **No ghosting:** where the two layers sample different points, the crossfade shows both, a ghost of every bright edge. So the turn is a real vortex's, not a rigid one: rigid inside `CYCLONE_CORE` (0.03 plate heights, about 28 px), then the same speed along every ring further out (the angle falls off as 1/r); and the inflow is a constant speed (`CYCLONE_INFLOW`, 0.0035 plate heights/s), growing from nothing over the core so the eye never pinches. The layers stay within about 8.5 px of each other anywhere in the storm (`swirlLayerGap()`); a rigid turn of the whole reach would put them 24 px apart.
- **Breath:** on top of the turn, the whole spiral moves in toward the eye and eases back out: the content comes from `cycloneBreath(t)` (11 px, a 9 s sine) further out along the radius. It is bounded, so it needs no crossfade and is the same in both layers. The eye stays still (the breath grows over the inner fifth of the reach).
- **Reach:** turn, inflow and breath are full over the inner 55% of the 190 px reach and gone at its edge; only pixels inside the reach take the second plate sample. The arms above the eye run up to the limb, where the calm band stills them.
- **Emblem:** all three are multiplied by 1 minus the emblem mask (`emblemAt()`), so the emblem keeps its shape while the arms beside it turn. Until the mask has loaded, the scene's placeholder counts everything as emblem and the storm holds still.

`plate-shader.test.ts` checks the layer gap over the whole reach, the vortex profile, that the breath is bounded and returns to rest after any number of breaths, and that the shader keeps all of it off the eye and the emblem.

### Pointer wake (`fluid.ts`, `earth-pointer.ts`)

When a mouse moves over the Earth, and only the Earth, the painted plate flows under it like fluid and settles back, as on the reference. The sky never reacts.

- **Who stirs it** (`earth-pointer.ts`): a fine pointer that can hover (`(hover: hover) and (pointer: fine)`); not touch or coarse pointers; not over links, buttons, form fields, summaries or anything marked `data-earth-ignore`; and only over the planet, past the limb's still band (`isOnEarth()`). A long move is split into steps of at most 10 px (`splatCount()`), so a quick sweep leaves a continuous wake.
- **The fluid** (`fluid.ts`, our own implementation of Stam's stable fluids): a 128 × 64 grid over the canvas. Each step advects and damps the velocity, adds vorticity confinement, projects it divergence-free (20 Jacobi iterations, warm-started, with the two-cell Laplacian that matches the central differences), then carries a displacement field along the flow, feeds it, and lets it decay. Splats are wide (5 cells) and gentle (velocity 12 and displacement 0.3 per cell moved), vorticity is mild (1.5), velocity is clamped to 30 cells/s and displacement to 8 cells, and a step is at most 1/30 s.
- **Feel:** a drag peaks at about 2.5 cells and is about a twentieth of a cell 2.5 s later. On screen one cell moves the plate by `WAKE_GAIN` (0.3) of a cell's width, about 3.4 px on a 1460 px canvas, so a drag pushes the clouds up to about 9 px.
- **Smoothness:** clouds should be pushed, not stretched. After a quick sweep no cell's displacement differs from its neighbour's by 0.8 cells or more (`fluid.test.ts`; the earlier narrow, strong splats reached 1.4 and drew streaks), and the shader reads the wake through a 5-tap blur `WAKE_BLUR` (1.5 cells) wide.
- **Cost:** the scene uploads the displacement as a 128 × 64 texture only while the wake moves; once the peak falls below 0.02 cells the solver resets and stops stepping.
- **Limb:** the wake joins the drift, weather and cyclone inside the same limb-safe motion, so the limb never moves.
- **Symbol:** the cloud symbol moves as one piece. Read pixel by pixel, the wake bent its strands apart and the picture seemed to stretch, so over the symbol `wake()` blends the local wake towards the wake averaged across the symbol (five samples, centre weighted), by the same soft ellipse that calms the weather there (`symbolCalm`). The S/D slides with the clouds around it and settles back keeping its shape, while the clouds beside it still flow.

Measured in Chromium as the mean pixel change over the cloud symbol: idle 0.89; after a sweep across the Earth 9.67; after a sweep across the sky 0.86 (no reaction); three seconds after an Earth sweep, within about one of the ambient drift over the same time.

## Fallback (`EarthFallback.tsx`)

What shows without WebGL, and under the scene everywhere:

- **Sky:** `<StarfieldSky />`, filling the hero.
- **Plate:** two canvases, placed by `plateLayoutCss()` (`plateRect()` in CSS, container query units), into which the plate is drawn once it has loaded:
  - the planet: the plate clipped to the limb (`Path2D` of `horizonPath()`);
  - the glow: on a half-size canvas, the plate with each pixel's alpha set as the shader sets it outside the limb (`maskGlow()`: `glowCoverage()` times `glowFade()`), composited normally. The planet stays opaque on it, so the planet canvas's anti-aliased edge has the plate under it and the limb shows no dark seam.
- **Variant:** `pickPlateVariant()` for the plate's device pixels (DPR capped at 2), loaded with the same CORS mode as three.js's loader, so the scene reuses the cached file. A resize that needs more loads a sharper one. The canvases never hold more pixels than the plate itself.

**Why canvases, not images:** a canvas is never a Largest Contentful Paint candidate. Drawn as an `<img>`, the large decorative plate became Home's LCP on a throttled phone (3.47 s in CI, over the 2.5 s budget), taking it from the description paragraph. With canvases the paragraph is the LCP again (`e2e/vitals.spec.ts`).

With the scene's canvas hidden, the fallback is indistinguishable from the scene. `e2e/earth.spec.ts` checks the sky and that both plate canvases are drawn, that reduced motion creates no scene canvas, stops the stars and still draws the plate, and that the scene fades in where WebGL 2 is available.

## Sharing the GPU

The Earth has the highest priority in `scene-budget.ts` (`earth: 3`), above the footer smoke, so when both are on screen only the hero draws. It pauses off-screen and in hidden tabs, and disposes its GPU resources on unmount (see [astrafield.md](astrafield.md#renderer-lifecycle) for the renderer lifecycle it shares). The starfield sky is SVG and CSS, not WebGL, so it never competes for the GPU budget..
