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
| Pointer wake | clouds near a moving mouse, pushed along its path | see `wake.ts`: push = velocity x 60 ms, max 0.03 H, 0.07 H reach, gone in about 2 s |

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
