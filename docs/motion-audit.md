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

## Timings (Beemas, Confirmed)

### The rise: one spring for text and blocks

Heading letters (from 75 px) and block fade-ups (from 35, 50, 75, 100 and 150 px) all follow the same
curve. Remaining offset as a share of the start, against an overdamped spring with stiffness 90,
damping 33 and mass 1:

| Time after it starts | Letters, 75 px | Block, 50 px | Block, 150 px | Spring (k 90, c 33) |
|---|---|---|---|---|
| 200 ms | 0.64 | 0.63 | | 0.61 |
| 270 ms | | | 0.50 | 0.50 |
| 400 ms | 0.35 | 0.34 | | 0.34 |
| 500 ms | 0.25 | | | 0.25 |
| 600 ms | 0.19 | 0.18 | | 0.18 |
| 1000 ms | 0.05 | 0.05 | | 0.06 |
| 1500 ms | 0.01 | 0.00 | | 0.01 |

Opacity follows the same spring from its start value to 1. There is no overshoot (peak past the end:
0.01 px). Settled to 1% at about 1.5 s.

### Text rises line by line

Beemas splits headings into letters, but the letters of one line move together. Lines start one after
another. In a four-line paragraph the lines started 274, 358, 575 and 765 ms after it was scrolled into
view: 84, 217 and 190 ms apart, so a **line stagger of about 0.16 s** after a **first delay of about
0.27 s** (Confirmed). There is no stagger between the letters or the words of a line (Confirmed, 43
words sampled).

### Groups stagger by 0.2 s

Sibling cards in a group (the 75 px fade-ups in the services section) started 433 and 633 ms after
scrolling: **0.2 s apart** after a **first delay of about 0.4 s** (Confirmed).

### Side slides: a quicker spring

The ±200 px slides (the two columns of "Why Beema") follow a critically damped spring, faster than the
rise:

| Time after it starts | Measured | Critically damped, ω 8 (stiffness 64, damping 16) |
|---|---|---|
| 216 ms | 0.47 | 0.48 |
| 430 ms | 0.15 | 0.14 |
| 620 ms | 0.045 | 0.042 |
| 820 ms | 0.010 | 0.011 |

The left column started about 0.62 s after scrolling and the right one about 0.42 s: the right one is
not delayed, the left one is (Inferred: a 0.2 s offset, like the groups).

### The header appears on a long, soft spring

Beemas' only "appear" animation (Framer's on-load effect, read from its appear-animation script): the
header from opacity 0.001 and 10 px above, a spring with `duration` 2.7 and `bounce` 0.2 (Confirmed).

## Gaps

- **Hover.** Arrow and card hover states on Beemas did not change under a headless pointer, so their
  timing is not measured. The site keeps its own hover motion: rolling button labels and card lifts.
- **Page transitions.** Beemas navigates without a visible transition (Framer's default instant route
  change, Inferred from the absence of overlay elements). The site keeps its five-panel transition.
- **Ignivo timings** were not sampled. Its kinds are listed above for completeness; the site already
  implements the ones it uses.
- Frames were sampled, not filmed.

