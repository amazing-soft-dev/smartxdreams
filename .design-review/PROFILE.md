# Design review profile

What a design review of this site needs to know before it starts. Kept by the `senior-design-review`
skill and committed; the captures and reports of each run live in `.design-review/runs/`, which is ignored.

## Audience

```
Industry / business: a studio building six focused AI products, all on waitlists · Goal: waitlist sign-ups
Primary audience: general consumers on phones (job seekers, dental patients) · Secondary: older adults
  (SeniorAIPlans), site foremen (SiteLog), small software teams on desktop (TrustDraft)
Context: phones first for the consumer products, 1366-1920 desktop for TrustDraft · one or two visits, not
  a daily tool · no expertise assumed · the trust need is high: the products read bills, letters, job forms
  and security documents
Main path per audience: Home or a blog post -> the product's page -> "Join the waitlist" (email, consent)
Lens: general consumers + seniors + B2B buyers x SaaS
Source: site copy, src/content, docs/compliance.md (inferred, 2026-11-19)
```

Weights used (rubric defaults, shifted for a consumer site): audience fit 10, hierarchy and CTA 13,
typography 10, colour 10, spacing 8, component sizing 10, content type 7, responsive 12, interaction
states 8, accessibility 6, consistency 2, copy 3, motion 1.

## Brand decisions (deliberate; do not "fix")

- **Palette.** Ink `#0F1226`, canvas `#F5F2EE`, violet-500 `#6D4AFF` for accents, links and focus,
  coral-500 `#FF6B3D` for primary buttons with ink text (white on coral fails). Every pairing and its
  ratio is in `docs/design-tokens.md`; muted text is ink at 65% or darker, white at 60% or brighter.
- **Light theme only.** `color-scheme: light`; dark sections are part of the one theme, not a dark mode.
- **Type.** Inter Tight, headings at weight 400 with tight tracking, a fluid scale from 390 to 1440 px.
  One `h1` per page; size comes from the class, not the level.
- **Shape.** Large radii: card 30, panel 22, bar 18, button 16, field 14, tag 12 px.
- **Breakpoints.** `md` 810, `lg` 1024 (desktop navigation), `xl` 1440. Card grids step at 700 and 1200 px.
- **Home hero.** The painted Earth with the cloud emblem is brand artwork (`docs/earth.md`), not a stock
  image; the hero fills the first screen on purpose and its headline is the largest element.
- **Motion.** Springs, line-by-line heading rises, the page transition, the WebGL backdrops and the
  footer aurora are intended (`docs/motion-audit.md`). Reduced motion and the footer's "Pause animations"
  switch must keep working.
- **Logo.** The SD ribbon comes as two raster marks chosen by surface; the wordmark is live text
  (`docs/brand.md`).
- **Honesty rules.** No invented statistics, testimonials, partner logos or people; product screens are
  captioned "Illustrative screen" (`docs/compliance.md`).
- **SeniorAIPlans.** `readability: "large"` raises body text to 19 px and removes muted text on that page.

## Accepted exceptions

- Product mockups use 11 to 13 px text. They are illustrations of a screen, captioned as such, not text
  the visitor has to read.
- Field labels, tags and pills are 14 or 12 px in medium weight.
- The "How we build" section on Home is several screens tall: it is a pinned, scroll-driven stepper.

## Notes for the next run

- The measurement script reports the header's links at 4.19:1; sampled from screenshots they are 5.7:1 on
  light glass and 7.6 to 8.3:1 on dark glass. It also reports every form field's boundary as missing: the
  fields are outlined with a ring (a box-shadow) at 3.5:1 or better.
- Run the captures against a production build (`npm run build`, `next start`); the scroll reveals and the
  hero differ in development.
- The team profiles on About are stand-ins (`illustrative: true`). They are labelled on the page; the
  owner decides whether to replace or remove them before launch.

## Score history

| Date | Commit | Grade | Notes |
|---|---|---|---|
| 2026-11-19 | `0089883` | C (78/100), projected A (91) with #569 to #577 | No blockers. Component sizing (2/4) and seven categories at 3/4 set the grade. |
