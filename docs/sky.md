# Starfield sky

The night sky around the planet in the Home hero, after the "Starfield" code component on the Framer reference site (comprehensive-europe-114474.framer.app). We rebuilt it from that component's parameters with our own code; nothing is loaded from Framer. Code lives in `src/components/sky`.

It is not mounted yet. A later issue places it behind the Earth plate in `HomeHero`.

## Using it

Place `<StarfieldSky />` inside a positioned container. It fills the container (`absolute inset-0`) and paints its own background.

```tsx
<section className="relative isolate overflow-hidden">
  <StarfieldSky />
  …
</section>
```

It is decorative: `aria-hidden`, `pointer-events: none`, and it never reacts to the pointer. `className` is merged onto the root, for example to set a `z-index`.

## Layers

From back to front:

1. **Sky:** the `space` colour token, `#070117` (`rgb(7, 1, 23)`).
2. **Stars:** one SVG, three `<g>` depth layers of `<circle>`s, then a `<g>` for shooting stars.
3. **Atmosphere:** a `<div>` with a violet radial gradient, blended with `lighten`.

## Parameters

Every value below comes from the reference component. The constants are in the files named.

### Stars (`stars.ts`)

| Parameter | Value | Constant |
|---|---|---|
| Count | 200 | `STAR_COUNT` |
| Position | x and y 0–100 % of the sky | |
| Radius | 0.5–2 px | `STAR_SIZE` |
| Colours | `#FFFFFF` or `#B5CFFF`, picked 50/50 | `STAR_COLORS` |
| Fill opacity | 1 | |
| Depth | 0.2 (far) to 1 (near) | `STAR_DEPTH` |
| Seed | mulberry32 at 20261117 | `STAR_SEED` |

The PRNG is `seededRandom` from `src/components/astra/stars.ts`. A fixed seed means the server and the client render the same markup, so there is no hydration mismatch, and every visit gets the same sky. Values are rounded to three decimals to keep the markup short.

### Twinkle (`StarfieldSky.module.css`)

| Parameter | Value |
|---|---|
| Keyframes | opacity 1 → 0.3 → 1 |
| Duration | 2 s, linear, infinite |
| Delay | 0–2 s per star (`TWINKLE_MAX_DELAY`) |

### Size pulse (`stars.ts`, `StarfieldSky.module.css`)

The reference sets each star's radius every frame to

```
r = size + (0.5 + 0.5·sin(t/2000 + i) − 0.5)·0.25·size   =   size·(1 + 0.125·sin(t/2000 + i))
```

with `t` in ms and `i` the star's index. We run the same curve as a CSS `scale` keyframe, so React never renders per frame:

| Parameter | Value | Constant |
|---|---|---|
| Scale | 0.875–1.125 | `PULSE_AMOUNT` (0.125) |
| Period | 2000·2π ≈ 12 566 ms | `PULSE_PERIOD_MS` |
| Phase | star `i` starts `i` radians in: a delay of −(i mod 2π)·2000 ms | `pulseDelayMs(i)` |
| Curve | quarter periods with easeOutSine / easeInSine, which follows a sine closely | |

### Shooting stars (`shooting-stars.ts`)

| Parameter | Value |
|---|---|
| Frequency f | 0.6 per second |
| Next one after | 1000/f to 3000/f ms (1.7–5 s) |
| Start | x 0–100 %, y 0–30 % |
| Heading | 0.7π–0.95π (down and to the left; y points down) |
| Speed | 0.5 % per 16 ms |
| Trail | 8 %, behind the head |
| Colour, opacity | `#FFF7C2`, 0.2 |
| Shape | 2 px line with round caps, plus a 2.5 px head (circle radius) |
| Blur | 0.5 px (`feGaussianBlur`, the same as CSS `blur(0.5px)`) |
| Removed | once the head leaves −10..110 % on either axis |

Positions are in percent of the sky's width and height, as in the reference, so on a wide hero the paths lean flatter.

The blur is an SVG filter rather than CSS `filter`, which Safari does not apply to SVG elements reliably. Its region covers the whole sky, so thin, nearly flat trails are never clipped.

### Atmosphere (`StarfieldSky.module.css`)

| Parameter | Value |
|---|---|
| Gradient | `radial-gradient(ellipse at 50% 60%, rgb(168, 78, 237) 12%, transparent 100%)` |
| Opacity | 0.15 |
| Blend | `mix-blend-mode: lighten` |

### Scroll (`scroll.ts`)

| Parameter | Value | Constant |
|---|---|---|
| Parallax | `y += scrollY·(1 − depth)·0.03 %·easeInOut(min(1, scrollY/3000))` of the sky's height | `PARALLAX`, `parallaxOffset()` |
| Ease | easeInOutQuad | `easeInOut()` |
| Depth layers | 3, each an equal slice of 0.2–1, moved at the middle of its slice (0.33, 0.6, 0.87) | `DEPTH_LAYERS`, `layerDepth()` |
| Thinning | visible stars fall linearly from 200 at the top of the page to 40 % (80) at the bottom | `THIN_TO`, `visibleStarCount()` |

Far stars drift down the most as the page scrolls; near stars barely move. Rather than moving 200 stars one by one, each depth layer moves as one `<g>` transform. Thinning keeps the first N stars of the seeded list and hides the rest, so the stars that go are random but always the same ones.

## How it runs

- **Stars:** server-rendered SVG. Twinkle and pulse are CSS animations on each `<circle>`, with per-star delays inline.
- **Shooting stars:** one `requestAnimationFrame` loop (`createShootingStarLoop`) moves them and adds and removes their SVG nodes. React never renders per frame. Time only advances while the loop runs, so a paused sky never fires a burst on resume, and a long frame is capped at 100 ms.
- **Pausing:** an `IntersectionObserver` and `visibilitychange` stop the loop when the sky is off screen or the tab is hidden, and set `data-paused` on the root, which pauses the CSS animations too.
- **Scroll:** a passive `scroll` listener schedules at most one update per frame. A `ResizeObserver` keeps the sky's height current for the parallax.

## Reduced motion

`prefers-reduced-motion: reduce` gets a still sky: the same stars and haze, with no twinkle, pulse, shooting stars, parallax or thinning. A media query stops the CSS animations from the first paint; `useReducedMotion` keeps the loop and the scroll listener from starting, and stops them if the preference changes.

## Tests

`stars.test.ts` checks the generator: 200 stars, the same sky for the same seed, every value inside the ranges above, both colours and all three depth layers used, and each layer's depth inside its own slice.
