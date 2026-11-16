# Architecture

The SmartxDreams site is a Next.js App Router application deployed by Vercel from `main`. The full plan is in `SMARTXDREAMS-PLAN.md`; this page describes how the code is organized.

## Build targets

| Target | Command | What it is |
|---|---|---|
| Server | `npm run build` | What Vercel runs. API routes (contact, waitlist) send email through Resend. Images use the Next.js optimizer (AVIF, then WebP) |
| Static | `NEXT_OUTPUT=export npm run build` | Plain HTML in `out/`. No server, so no `/api` and forms cannot send. `npm run images` pre-builds WebP variants and `src/lib/image-loader.ts` serves them. CI builds it to keep the export valid |

`next.config.ts` switches between them on `NEXT_OUTPUT`.

## Source layout

```
src/
  app/            Routes, root layout, metadata files (icons, manifest, sitemap, robots, OG images)
  components/
    ui/           Primitives: Logo, Button, Tag, Section, Card, Glow, Accordion, FilterChips, DigitRoller, Ticker
    motion/       SmoothScroll (Lenis), Reveal, page transition, WebGL scenes
    nav/          Header, mega-menu, mobile menu, footer
    sections/     Page sections composed from primitives
    mockups/      Code-built product UI mockups
    blog/         Post cards, table of contents, reading progress
  content/        All copy, typed: site.ts, products/<slug>.ts, blog posts, selectors.ts, types.ts
  lib/            env (zod), image loader and config, API helpers
  styles/         motion.ts (easings, springs, durations for JS)
scripts/          images, check:images, verify:out, brand asset generators
docs/             pipeline, design tokens, architecture
public/
  brand/          Logos and app icons
  images/         Photos (Unsplash/Pexels), each used exactly once; variants go to public/_img (generated)
```

## Principles

- **Content is data.** Pages read typed copy from `src/content`; components never hard-code text. Each product has its own file to avoid merge conflicts.
- **Server components by default.** Client components are limited to interactive or animated parts (menus, filters, Lenis, WebGL), and are lazy-loaded when heavy.
- **Tokens, not values.** Colors, type, radii, shadows and easings come from `@theme` in `src/app/globals.css`; JavaScript motion uses `src/styles/motion.ts`.
- **Motion is optional.** Every effect checks `prefers-reduced-motion`; hover effects need `(hover: hover) and (pointer: fine)`; Lenis is off on touch screens.
- **Environment is validated.** `src/lib/env.ts` parses variables with zod; email settings are optional at build time and checked by the API routes at request time.
- **No fabricated proof.** No invented customers, numbers or testimonials in copy.

## Pipeline

Issue → branch from `dev` → automatic pull request → CI → automatic merge → automatic `dev` → `main` promotion. See [pipeline.md](pipeline.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
