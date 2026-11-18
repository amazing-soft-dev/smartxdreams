# Motion audit: Beemas and Ignivo

The site's section structure follows [Ignivo](https://ignivoo.framer.website) and its motion should match
[Beemas](https://beemas.framer.website), without dropping any animation the site already has. This page
records what both reference sites actually do, measured in a real browser, so the motion work (#379 to
#391) implements numbers rather than impressions.

**How it was measured (November 2026).** Headless Chromium at 1440 x 900, after the page settled for 3 s.
For each kind of animation, the first element of that kind below the fold was scrolled to 60% of the
viewport and its computed `opacity`, `transform` and `filter` were read every frame for 2.6 to 3.2 s. The
sampling scripts are not part of the repository; the numbers are.

**Confirmed** means sampled. **Inferred** means reasoned from the samples or the DOM, not measured directly.

## What starts hidden

Every element below the fold whose inline style starts it transparent, grouped by its starting state.

| Beemas | Count | Ignivo | Count |
|---|---|---|---|
| Opacity 0.001, `translateY(75px)`: heading text, split into letters | 224 | Opacity 0, `blur(10px)`: text, split into words | 153 |
| Opacity 0, `translateY(50px)` | 10 | Opacity 0, `translateY(60px)` | 27 |
| Opacity 0, `translateY(150px)` | 9 | Opacity 0 (fade only) | 22 |
| Opacity 0, `translateY(75px)` | 5 | Opacity 0, `translateX(-120%) skewX(-18deg)` (a slanted wipe) | 9 |
| Opacity 0, `translateY(100px)` | 3 | Opacity 0, `translateY(±160px)` | 13 |
| Opacity 0, centred, `translateY(±75px)` | 5 | Opacity 0, `translateX(±200px)` | 7 |
| Opacity 0, `translateX(±200px)` | 2 | Opacity 0, `rotate(±12deg)` | 4 |
| Opacity 0, `translateY(35px)` | 1 | Opacity 0, `translateY(8 / 30 / 120px)`, `translateX(-56 / 60px)` | 6 |

The site's current motion was modelled on Ignivo: the hero cards' `waveDown`/`waveUp` are its ±160 px, and
the home statement's word-by-word blur is its `blur(10px)` text. Those stay. Beemas' kinds are added.

### Not entrance animations (Confirmed)

An earlier pass counted these as entrances. Sampling shows they are not:

- `blur(10px)` and `blur(24px)` on Beemas are **`backdrop-filter`** on glass panels: static, not motion.
- `rotateY(90deg)` "Line" elements are the bars of Beemas' header menu icon.
- `filter: saturate(0)` with `rotate(±8deg)` are the testimonial portraits' resting state, inside a variant
  Framer calls "No Animation": a fanned stack of grey photos. The site's About portraits borrow the look
  as an entrance (#374). That use is our own, not a copy of Beemas' timing.
- `skewX(±4deg)` wrappers sit in the same "No Animation" variant.
- Arrow icons rest at `rotate(-30deg)`. Hovering the "Read More Post" and "Get a Quote" links with a
  headless pointer changed nothing measurable. Their hover is not captured (see Gaps).

## Gaps

- **Hover.** Arrow and card hover states on Beemas did not change under a headless pointer, so their
  timing is not measured. The site keeps its own hover motion: rolling button labels and card lifts.
- **Page transitions.** Beemas navigates without a visible transition (Framer's default instant route
  change, Inferred from the absence of overlay elements). The site keeps its five-panel transition.
- **Ignivo timings** were not sampled. Its kinds are listed above for completeness; the site already
  implements the ones it uses.
- Frames were sampled, not filmed.

