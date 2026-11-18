# SmartxDreams company website: updated plan, revision 3 (awaiting approval)

> **Status: plan only. I haven't changed the repo for this revision.** This file is edited in the working tree and not committed.
> Repo: `amazing-soft-dev/smartxdreams` (public).

---

## 0. Revision 3: workflows first, then the site

You asked for the GitHub workflows to be **created and proven before any site code**, plus **three.js for the homepage star-field (`AstraField`)**. I checked the real repo state first (read-only), because it has moved since revision 2.

### 0.1 Current repo state (verified with `gh`/`git`, not assumed)

| Item | State |
|---|---|
| Issues | **#1–#64 exist** (#1 closed, #2–#64 open). PRs #65 and #66 are merged, so the next free number is **#67** |
| `dev`, `main` | Both exist. `dev` and `main` currently contain only: `.gitignore`, `LICENSE`, `README.md`, `SMARTXDREAMS-PLAN.md`, `package-lock.json` and 9 files in `public/` (two logos + favicon set) |
| ⚠️ Scaffold | Issue #1's scaffold was merged, then **commit `cd50005` "chore: remove unused configuration and initial project files" deleted `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `src/app/*` and most of the README**. Only `package-lock.json` is left. The lockfile pins Next 16.4.6, React 19.3.1, ESLint 10.15.0 and **TypeScript 6.0.3** |
| `.github/` | **Doesn't exist** on any branch: no workflows, no rulesets, no Dependabot |
| Rulesets | **None** (direct pushes to `dev` and `main` are currently possible) |
| Secrets | **No `GH_TOKEN`** repository secret |
| Actions settings | Actions enabled; default workflow permissions **read-only**; "create and approve pull requests" **off** |
| Merge settings | Merge commits, squash and rebase are all allowed; auto-merge off; head branches are not auto-deleted |

I'm treating that scaffold removal as **intentional**, i.e. a clean slate so workflows come first. If it was an accident, tell me and I'll restore it in step 5 below exactly as it was.

### 0.2 The new order

```
PHASE 0: Pipeline (no site code)          PHASE 1+: Site
 #3 workflows  → #68 happy-path probe  →   #67 restore scaffold (rides the pipeline)
 (+ you: GH_TOKEN, settings)  #69 red-CI probe       → #2, #4 … #73 in dependency order
                              #70 guard checks
                              ── GATE: all pass ──┘
```

1. **You** add the `GH_TOKEN` secret and turn on "Allow GitHub Actions to create and approve pull requests" (§7.1). I can't create a token for you, and I won't copy the token in this machine's environment into repo secrets without your say-so.
2. **#3** writes the three workflows, Dependabot config and ruleset JSON, with a *bootstrap mode* so CI can pass with no app yet (§7.2). It lands by hand because `merge-passing-pr` doesn't exist on `main` yet.
3. **#68, #69, #70** prove the pipeline end to end, including the failure and abuse paths (§7.3).
4. **Gate:** every check in §7.4 passes → you import the rulesets → I re-run the guard checks. If anything fails, a `fix/` or `ci/` issue repairs it and the check re-runs. **If all pass, I continue automatically**; I only stop earlier if I'm stuck.
5. **#67** restores the scaffold *through the proven pipeline* and deletes the bootstrap flag, so CI turns strict. Then the site issues (#2, #4–#64, #71–#73) follow.

---

## 1. What changed vs. the Ignivo audit

The Ignivo audit described a SaaS template. This plan turns it into a **company site for SmartxDreams, a studio that builds 6 AI products**. Layout and motion patterns are rebuilt clean-room with our own brand, copy and code-built mockups. Nothing from the template (images, copy, code) is reused.

### Your decisions

| Topic | Decision |
|---|---|
| Site map | Full company site: Home, `/products`, 6 product pages, About, Blog (+ categories), Contact, 404 |
| Product CTA | **Waitlist per product** (email, tagged by product) |
| Product names | I propose names (§3); you approve or edit |
| Bootstrap | **You** create `dev`, add the `GH_TOKEN` secret and import rulesets (§7) |
| Visuals | Ignivo layout, **your brand colors** |
| Motion | **Full Ignivo parity** (page transition, Lenis smooth scroll, WebGL aurora footer (originally smoke), hero selection box, scroll-scrubbed stepper, cursor-badge cards, rolling buttons, digit counters), with the accessibility fixes from the audit |
| Imagery | **Updated:** real photos searched and downloaded from **Unsplash and Pexels** (§5.1). The product hero UIs stay code-built mockups, and photos are used for the supporting spots around them |
| Third-party brands | Names as plain text only; no logos; trademark footnote |

### Brand facts read from your `public/` files

| Item | Finding |
|---|---|
| `04 Overlap-selection (4).png` | 448×448 **mark**: ink rounded square + violet circle, overlap in coral |
| `04 Overlap-selection (6).png` | 2400×480 **mark + wordmark** "SmartxDreams" (the "x" is violet) |
| Colors (sampled) | Ink `#0F1226`, Violet `#6D4AFF`, Coral `#FF6B3D` |
| `favicon_io/` | ✅ correct set (mark only) |
| `favicon_io (1)/` | ❌ wordmark squashed into a square; unreadable at 16 px. I propose deleting it, the two `.zip` files, and renaming the PNGs (needs your OK, issue 06) |
| `site.webmanifest` | `name` and `short_name` are empty, `theme_color` is white; fixed in issue 06 |
| ⚠️ Dark backgrounds | The wordmark text is ink on a transparent/white background. On the dark hero and header it would vanish. Fix: **SVG mark + live-text or white wordmark variant** for dark surfaces (issue 06). If you have a white wordmark file, drop it in `public/` |

---

## 2. Design system (SmartxDreams)

| Token | Value | Use |
|---|---|---|
| `ink` | `#0F1226` | Dark heroes, text, panels, transition panels |
| `violet` | `#6D4AFF` | Accent words, links, focus ring, glows |
| `coral` | `#FF6B3D` | Primary buttons, highlights, hero glow |
| `canvas` | warm off-white (final value picked in issue 04) | Body background |
| Glass | `rgba(15,18,38,.2)` + `blur(15px)`; white 10–20% on dark | Cards |

Rules carried over from the audit:
- **Type:** Inter Tight (headings weight 400, UI 500); fluid scale display 44→68 px, H2 34→52 px (fixes the audit's "52 px on phones" problem); one `<h1>` per page at every width.
- **Shape:** card radius 30, button 16, tag 12; bento gaps 8–12; content width 1280.
- **Contrast:** white on coral `#FF6B3D` is about 2.8:1 and **fails**, so coral buttons use **ink text**. White on violet passes. Every pairing is checked in issue 04.
- **Motion tokens:** `panel (.76,0,.24,1)`, `outQuint (.22,1,.36,1)`, `inOutCubic`, `outExpo`, `backOut`, and springs A (bounce .2, .6 s) and B (bounce .3, 1.1 s).

---

## 3. Products, proposed names and page content

Names are **proposals only**. I can't check trademark or domain availability from here, so please verify before committing to them.

| # | Product (proposed) | Slug | Audience | Page hero idea (code-built mockup) |
|---|---|---|---|---|
| 1 | **Joined**: all-in-one job platform | `/products/joined` | Job seekers | Unified feed from LinkedIn, Indeed, Jobright, Dice and company career pages, with source chips, dedupe badge and a company-details drawer |
| 2 | **Acorn**: AI copilot job-apply extension | `/products/acorn` | Job seekers | Browser frame with a form filling field by field from the profile, ending at a **"Review before you submit"** step |
| 3 | **SiteLog**: daily site reports | `/products/sitelog` | Small builders, foremen | Photos + voice note → generated report with weather, crew, progress, delays |
| 4 | **ToothLedger**: dental insurance researcher | `/products/toothledger` | Dental patients | Quote + plan → "you pay" breakdown, remaining annual limit bar, waiting-period flags, two-calendar-year split comparison |
| 5 | **SeniorAIPlans**: AI helper for seniors | `/products/senioraiplans` | Seniors managing alone | Bill or letter → plain-words explanation, scam alert, document shelf, weekly check-in |
| 6 | **TrustDraft**: security questionnaire helper | `/products/trustdraft` | Small software companies | Questionnaire rows with drafted answers, source citations, "can't back this up" flags, reviewer approve step |

Each product page uses **one shared template** (hero, problem, how-it-works in 3–4 steps, feature bento, "who it's for", honest limits, FAQ, waitlist form, related products). Product content lives in `src/content/products/<slug>.ts`.

### Copy and safety rules (apply to every page)

- **No fabricated proof.** No invented customer counts, testimonials, logos or percentages. The Home "proof" section shows principles and what is being built until real numbers exist.
- **Acorn:** the user always reviews before anything is submitted. Don't promise "100% automatic" or interview outcomes.
- **ToothLedger:** the output is an estimate based on the uploaded documents, not a guarantee of coverage. It is not insurance, financial or dental advice.
- **SeniorAIPlans:** scam detection reduces risk but isn't a guarantee. It doesn't replace medical, legal or financial professionals. Large type, high contrast and plain language on that page.
- **TrustDraft:** AI drafts, a human approves everything before it is sent. Unsupported answers are flagged, never invented.
- **Job sources:** brand names appear as text only, with the footnote *"Product and company names are trademarks of their respective owners; SmartxDreams is not affiliated with them."*

---

## 4. Site map

```
/                        Home: hero (selection-box headline + mockup wave), product grid, statement reveal,
                         "how we build" stepper, principles/proof, FAQ, CTA, footer
/products                All 6 products, filter chips by audience (Job seekers · Builders · Patients · Seniors · Software teams)
/products/[slug]  ×6     Shared template
/about                   Story, values, team placeholder, roadmap
/blog                    Featured + filterable grid (cursor-badge cards)
/blog/[slug]             Article (68ch measure, TOC, progress bar, Article JSON-LD)
/blog/category/[cat]     Real, shareable category routes
/contact                 Form → POST /api/contact
/privacy  /terms         Added by me: required because we collect emails (waitlist/contact)
/404
Also: sitemap, robots, llms.txt, Open Graph images, lowercase redirects (/About → /about)
```

API (Node runtime, Resend): `POST /api/contact`, `POST /api/waitlist`. **Not** the `/api/hire`, `/api/cv`, `/api/salary-guide` or AI-training routes from the pasted workflow doc. Those belong to the bridgewide.org project.

---

## 5. Architecture

```
src/
  app/                      routes, layout, sitemap, robots, opengraph, llms.txt, api/{contact,waitlist}
  components/
    ui/                     Button(RollingLabel) Tag Section Card Glow Accordion FilterChips DigitRoller Ticker Logo
    motion/                 Reveal SmoothScroll(Lenis) TransitionProvider AuroraBackground
    nav/                    Header MegaMenu MobileMenu
    sections/               Hero ProductGrid Statement Process Principles Faq Cta
    mockups/                Joined Acorn SiteLog ToothLedger SeniorAIPlans TrustDraft (HTML/CSS, aria-hidden or labelled)
    blog/                   PostCard(CursorBadge) Toc ReadingProgress
  content/
    site.ts                 nav, footer, global copy, FAQ
    products/<slug>.ts      one file per product (avoids merge conflicts)
    blog/*.mdx              seed posts
  lib/                      env (zod), validation (zod), rate-limit, resend, seo
```

Dependencies beyond your stack: **Lenis**, **zod**, an MDX loader. All are justified by the choices above. **three.js** is now in your stack (for `AstraField`, §5.2).

**Versions** (latest on npm today, checked): Next 16.4.6 · React 19.3.1 (lockfile) · TypeScript **7.0.2** (the old lockfile has 6.0.3, so the restore in #67 uses `^7` and re-checks `eslint-config-next`; if it breaks, I fall back to 6.x and say so in the commit) · Tailwind 4.3.5 · ESLint 10.15.0 · three 0.187.0 (+ `@types/three`) · Motion 14.14.0 · Lenis 1.3.27 · Resend 6.38.1 · zod 4.6.7 · sharp 0.35.5. The React Compiler options (`reactCompiler`, `turbopackRustReactCompiler`) are verified against the installed Next at restore time; a flag that doesn't exist is dropped with a note.

The pasted stack lists `/api/hire`, `/api/cv`, `/api/salary-guide` and AI-training routes. **Those aren't SmartxDreams routes**; we build only `/api/contact` and `/api/waitlist`.

### 5.2 AstraField: homepage star-field (three.js)

A star-field behind the Home hero, with our palette:
- **Rendering:** `THREE.Points` with a small custom shader (size attenuation, soft round sprites, twinkle), about 4–6k stars, white with a few violet and coral stars. A slow drift and pointer parallax.
- **Product constellations:** six faint star clusters, one per product. Hovering a product card or a hero chip brightens that constellation's lines (`LineSegments`) and dims the rest. This ties the visual to the six products.
- **Loading:** imperative three.js in a client component, loaded with `next/dynamic` (`ssr: false`) after the headline paints, so it can't hurt LCP. Budget: **≤ 200 KB gzipped** extra on Home only.
- **Fallbacks:** a static CSS star gradient for reduced motion, no WebGL, save-data, and low-power devices; pauses off-screen and on hidden tabs; DPR capped at 1.75; full `dispose()` on unmount; two WebGL contexts (AstraField + aurora footer) never render at the same time.
- **Accessibility:** decorative (`aria-hidden`), no information carried only by the animation, content readable over it (contrast checked on the darkest and brightest star areas).

### 5.1 Imagery: sourcing photos from Unsplash and Pexels

When we reach the image issues, I will search both sites in the built-in browser, pick the photos, and download them into the repo. Photos are added to **Unsplash/Pexels-only** places. The CI rule is that each photo is used once, so each slot needs its own distinct photo.

**Where photos go (about 27 distinct photos)**

| Slot | Count | Subject direction (search terms) |
|---|---|---|
| Home: "how we build" backgrounds (stepper swap) | 4 | Studio desk, whiteboard planning, laptop code, team review |
| Home: statement avatar chips | 0 | Initials/shape chips instead, to avoid identifiable strangers |
| Product pages, "who it's for" image (1 each) | 6 | Job seeker at laptop · same for copilot (different shot) · construction site/hard hat tablet · dental office/calculator and paperwork (no patient faces) · senior with tablet/paper letters · security/server room or compliance desk |
| About: story portrait, values, hero | 3 | Workspace, hands at keyboard, whiteboard |
| Blog covers | 7 | One per post (6 seed + the featured one), abstract or scene-based |
| 404 and contact hero backgrounds | 2 | Abstract light, tilted architecture |
| Open Graph fallback | 1 | Branded gradient (generated, not a photo) |
| Spare | 4 | Replacement stock if any slot fails review |

**Selection rules**
- **License:** Unsplash License and Pexels License only. Both allow free commercial use without required attribution. I'll still keep credits in a manifest and a short credits page section. I'll read each photo's license note before download and skip anything marked editorial-only or with "model/property release" warnings.
- **People in sensitive contexts:** for seniors, dental, insurance and job-search pages, avoid **identifiable faces** (pick hands, backs, over-the-shoulder or objects). That prevents implying a real person endorses or uses the product. Both licenses limit that use.
- **Brand look:** warm and neutral color so photos sit well against ink/violet/coral; I'll check legibility under overlays.
- **No logos or trademarks** in frame (job-board screens, brand-name signage).
- **Fit:** landscape 3:2 or 16:10 at least 2400 px on the long side so `sharp` can build 640/1024/1600/2400 WebP variants.

**Process per photo:** search → open the photo page → record URL, photographer, license and ID in `public/images/credits.json` → download the original through the site's download link → name it by slot (`product-senioraiplans-who.jpg`) → run the `images` script → alt text written for content photos (empty alt for decorative ones).

**Downloads:** only from unsplash.com / pexels.com (and their image CDNs). I'll state file names and sources in the issue and PR, and I won't run or open anything that isn't an image. If either site shows a bot check, login prompt or CAPTCHA, I'll stop and ask you, since I can't bypass those.

**Git size:** originals can be 2–10 MB each. I'll commit resized masters (long side 2400 px, quality ~80, about 300–600 KB) rather than raw downloads, so the repo stays small.

### Motion, parity with the accessibility fixes

| Effect | Rebuild rule |
|---|---|
| Page transition | 5 panels, ~1.1 s (vs. 2.7 s), opt-in `TransitionLink`, prefetch during cover, focus moves to `h1`, `aria-live` route announcement, skipped for reduced motion and back/forward uses View Transitions |
| Lenis smooth scroll | Time-based (not frame-based), off for `pointer: coarse` and reduced motion, `data-lenis-prevent` on dialogs |
| Header | Hide on scroll down, show on up; theme by IntersectionObserver (`data-nav-theme`), **no 800 ms polling** |
| Mega-menu | Real `<button aria-expanded>`, hover and keyboard, Esc closes, 140 ms hover grace |
| Mobile menu | `<dialog>` modal, lists **all** pages (the original dropped Features and Pricing), scroll lock |
| Aurora footer (replaced the smoke, #438) | Raw WebGL curtain shader with a brand colour loop over CSS drifting stars, paused off-screen and on hidden tabs, still CSS aurora fallback |
| Hero selection box | Cycles words every 2.35 s, paused under reduced motion, `aria-hidden` overlay |
| Process stepper | Sticky and scroll-scrubbed on desktop, plain stacked list on mobile |
| Cursor badge cards | 84 px "Read ↗" badge on `(hover:hover) and (pointer:fine)` only |

---

## 6. The 73 issues (#1–#64 exist; #67–#73 are new in this revision)

Issue numbers below are the **real GitHub numbers** (the issues already exist). A lone "01/02/…" in a *Depends* column means that issue number.

**Conventions**
- Each issue gets its own branch **from `origin/dev`**: `<prefix>/<issue-number>-<slug>`. Allowed prefixes are only `feat/ fix/ docs/ ci/ build/`, so tests and refactors use `feat/` or `build/`. Branch names below show `N` for the number GitHub assigns.
- Every commit uses a Conventional Commit subject (e.g. `feat(nav): …`). The **last commit** of each branch ends with `Closes #N`.
- **Commit trailers on every commit** (your two co-authors, plus the harness attribution):

```
Co-authored-by: shark314 <112891100+shark314@users.noreply.github.com>
Co-authored-by: tomost8 <178904341+tomost8@users.noreply.github.com>
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```
- Issues use a template: **Goal · Scope · Acceptance criteria · Out of scope · Depends on**. About 3–6 commits per branch, about 240 in total.
- I never push to `dev` or `main`; I push only issue branches, and the workflows do the rest.

### Phase 0: Pipeline first (no site code)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 03 | `ci/3-github-workflows` | Pipeline: workflows, Dependabot, rulesets | `ci: CI workflow with detect-app, bootstrap mode, actionlint and "CI passed" gate` · `ci: CI lint/typecheck job (runs only when the app exists)` · `ci: CI server and static build jobs with verify-out step` · `ci: open-pull-request workflow (prefix + issue-number rules, GH_TOKEN, dev→main body with Closes)` · `ci: merge-passing-pr with --match-head-commit and eligible-pair checks` · `ci: dependabot for npm and github-actions` · `ci: rulesets for dev and main in .github/rulesets (not yet applied)` · `docs: pipeline guide and token setup` | none (you: §7.1) |
| 68 | `docs/68-pipeline-probe-happy-path` | Probe 1: happy path end to end | `docs: pipeline probe note describing the expected sequence` · `docs: record run links in the issue (not in the repo)` | 03 on `main` |
| 69 | `fix/69-pipeline-probe-red-ci` | Probe 2: red CI, recovery and cancel | `ci: probe commit that makes CI fail (removes the bootstrap flag)` · `ci: probe fix commit that restores it` | 68 |
| 70 | `ci/70-pipeline-guards` | Probe 3: rules and abuse paths | `docs: guard-check log and findings in docs/pipeline.md` · `ci: fixes for any defect found (one commit per defect)` | 69, rulesets imported |
| 67 | `fix/67-restore-scaffold` | Restore Next.js scaffold, make CI strict | `build: restore package.json with scripts (lint, typecheck, build)` · `build(ts): tsconfig strict, TypeScript ^7, eslint-config-next check` · `build(next): next.config.ts with reactCompiler and static-export switch` · `build(lint): ESLint flat config, zero warnings` · `feat(app): minimal layout and placeholder page with the logo` · `docs: README quickstart` · `ci: delete .github/ci-bootstrap so CI is strict` | 70 passed |

### A. Foundation (remaining)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 01 | *(closed)* | Scaffold Next.js app | Landed earlier; the files were later removed (§0.1). **#67 restores them** | n/a |
| 02 | `build/2-static-export-images` | Static export and image pipeline | `build(next): NEXT_OUTPUT=export switch in next.config` · `build(images): sharp script for responsive WebP` · `build(images): custom loader for static export` · `build(images): check:images script (each photo used once, passes with zero photos)` · `build(ci): verify-out script (HTML, sitemap, icons, no out/api)` | 67 |
| 04 | `feat/N-design-tokens` | Brand tokens, fonts, base styles | `feat(tokens): ink/violet/coral scales and canvas in @theme` · `feat(type): Inter Tight via next/font and fluid scale` · `feat(tokens): radius, shadow, easing and spring tokens` · `feat(styles): base layer, focus ring, reduced-motion defaults` · `docs: contrast table for every color pairing` | 01 |
| 05 | `feat/N-content-model` | Content model and `site.ts` | `feat(content): Product, NavItem, Faq, Post types` · `feat(content): site.ts with nav, footer, company copy` · `feat(content): per-product files skeleton (6)` · `feat(content): selectors (productBySlug, byAudience)` | 01 |
| 06 | `feat/N-brand-assets` | Brand assets and favicons | `feat(brand): rename logos to logo-mark.png / logo-full.png` · `feat(brand): SVG mark rebuilt from the logo shapes` · `feat(brand): Logo component with light/dark wordmark` · `feat(brand): favicon set, apple-touch, webmanifest name and theme color` · `build(brand): remove duplicate favicon set and zips (after approval)` | 04 |
| 07 | `feat/N-seo-foundation` | SEO foundation | `feat(seo): metadata helper and defaults` · `feat(seo): sitemap and robots` · `feat(seo): llms.txt route` · `feat(seo): Organization and WebSite JSON-LD` · `feat(seo): Open Graph image generator` | 05, 06 |
| 08 | `feat/N-analytics-env` | Analytics and env validation | `feat(env): zod-validated env module` · `feat(analytics): Vercel Analytics and Speed Insights, production only` · `docs: .env.example` | 01 |
| 09 | `docs/N-contributing-templates` | Contribution docs and templates | `docs: CONTRIBUTING with branch, commit and co-author rules` · `docs: issue template (Goal/Scope/AC)` · `docs: PR template` · `docs: architecture overview` | 03 |

### B. UI primitives (8)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 10 | `feat/N-button-rolling-label` | Button with rolling label | `feat(ui): Button variants (coral, ink, ghost) and sizes` · `feat(ui): per-letter roll, shine sweep (hover:hover only)` · `feat(ui): icon tile and arrow hop` · `feat(ui): press and release states` · `feat(ui): reduced-motion fallback` | 04 |
| 11 | `feat/N-section-layout-tag` | Section, container, Tag, SectionHeader | `feat(ui): Container and Section with responsive padding` · `feat(ui): Tag pill with layered shadow` · `feat(ui): SectionHeader (tag, H2 with accent word, description)` · `feat(ui): accent-word helper` | 04 |
| 12 | `feat/N-reveal-motion` | Reveal presets (Motion) | `feat(motion): Reveal with up60, x60, wave presets` · `feat(motion): stagger group` · `feat(motion): reduced-motion and no-JS fallbacks` · `feat(motion): above-the-fold opacity .001 rule` | 04 |
| 13 | `feat/N-glow-glass-card` | Glow and glass Card | `feat(ui): Glow blob component (blur 200)` · `feat(ui): Card (glass, solid, gradient)` · `feat(ui): clipping rules to avoid horizontal overflow` | 04 |
| 14 | `feat/N-accordion-faq` | Accessible Accordion | `feat(ui): Accordion with button, aria-expanded, region` · `feat(ui): height animation and + icon spring` · `feat(ui): keyboard support (arrows, Home, End)` · `feat(ui): FAQPage JSON-LD helper` | 04 |
| 15 | `feat/N-filter-chips` | FilterChips and re-flow list | `feat(ui): chips as buttons with aria-pressed` · `feat(ui): layout-animated list with stagger` · `feat(ui): URL-synced filter hook` · `feat(ui): live-region result count` · `feat(ui): mobile horizontal snap bar` | 04 |
| 16 | `feat/N-digit-roller` | DigitRoller counters | `feat(ui): masked digit columns with tabular-nums` · `feat(ui): in-view trigger` · `feat(ui): screen-reader value` · `feat(ui): toggle-ready width animation` | 04 |
| 17 | `feat/N-ticker-marquee` | Ticker marquee | `feat(ui): CSS duplicated-track marquee` · `feat(ui): edge fade mask` · `feat(ui): pause on hover and reduced motion` | 04 |

### C. Global shell (9)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 18 | `feat/N-header-shell` | Header: hide on scroll, adaptive theme | `feat(nav): fixed header with entrance animation` · `feat(nav): hide and show by scroll direction` · `feat(nav): theme by IntersectionObserver (data-nav-theme)` · `feat(nav): logo swap light/dark` | 06, 11 |
| 19 | `feat/N-nav-megamenu` | Desktop nav and mega-menu | `feat(nav): desktop bar (shown from 1024 px)` · `feat(nav): Products mega-menu button with aria-expanded` · `feat(nav): preview pane cross-fade` · `feat(nav): keyboard and Esc handling, 140 ms grace` · `feat(nav): Sign-up → waitlist link` | 18, 05 |
| 20 | `feat/N-mobile-menu` | Mobile menu | `feat(nav): hamburger button morph` · `feat(nav): dialog-based menu with focus trap` · `feat(nav): all pages listed, products accordion` · `feat(nav): scroll lock and Esc to close` | 18 |
| 21 | `feat/N-footer` | Footer | `feat(footer): brand column and link groups` · `feat(footer): legal links and trademark footnote` · `feat(footer): social icons (mask recolor)` · `feat(footer): responsive layout` | 05, 06 |
| 22 | `feat/N-smoke-background` | WebGL smoke background | `feat(webgl): fBm fragment shader` · `feat(webgl): render loop, DPR cap, resize` · `feat(webgl): pause off-screen and on hidden tab` · `feat(webgl): static gradient fallback` · `feat(footer): mount in footer` | 21 |
| 23 | `feat/N-page-transition` | Page transition v2 | `feat(transition): provider and 5-panel overlay` · `feat(transition): label mask and glow layer` · `feat(transition): TransitionLink with prefetch` · `feat(transition): focus management and aria-live` · `feat(transition): View Transitions for history navigation` · `feat(transition): reduced-motion bypass` | 18 |
| 24 | `feat/N-lenis-smooth-scroll` | Lenis smooth scroll | `build: add lenis` · `feat(scroll): provider with time-based easing` · `feat(scroll): disable on coarse pointer and reduced motion` · `feat(scroll): anchor and route scroll integration` · `feat(scroll): data-lenis-prevent for dialogs` | 01 |
| 25 | `feat/N-cta-section` | Global CTA | `feat(cta): section with typed accent word` · `feat(cta): inline waitlist input wiring (stub until 53)` · `feat(cta): reduced-motion static word` | 10, 11 |
| 26 | `feat/N-not-found` | 404 page | `feat(404): tilted glass 4·0·4 tiles` · `feat(404): suggestions list from site.ts` · `feat(404): buttons and metadata` | 10, 13 |

### D. Home (7)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 27 | `feat/N-home-hero` | Hero with selection-box headline | `feat(home): hero layout and glow` · `feat(home): selection-box overlay cycling words` · `feat(home): label chip swap at 60%` · `feat(home): entrance animation springs` · `feat(home): single h1 and CTA` · `feat(home): mount AstraField behind the hero` | 10, 12, 13, 72 |
| 28 | `feat/N-home-mockup-wave` | Hero mockup wave | `feat(mockups): shared mockup frame` · `feat(mockups): 6 compact hero cards (job feed, autofill, report, cost bar, bill, questionnaire)` · `feat(home): staggered drop-in wave` · `feat(home): mobile horizontal snap carousel (hero ≤ 900 px)` | 27, 13 |
| 29 | `feat/N-home-product-grid` | Product grid | `feat(home): bento grid of 6 products from content` · `feat(home): card hover and focus states` · `feat(home): audience tags` · `feat(home): links to product pages` | 05, 13 |
| 30 | `feat/N-home-statement` | Statement reveal | `feat(home): statement rows with word blur-in` · `feat(home): caret and avatar-chip pops` · `feat(home): reduced-motion static text` | 12 |
| 31 | `feat/N-home-process-stepper` | "How we build" stepper | `feat(home): sticky section scaffold` · `feat(home): scroll progress and active step` · `feat(home): coral rail with lerp` · `feat(home): Gaussian tick bar and counter` · `feat(home): clip-path background swap` · `feat(home): mobile stacked fallback` | 12 |
| 32 | `feat/N-home-principles` | Principles and proof | `feat(home): principle cards (human in the loop, source-backed answers, privacy)` · `feat(home): honest stats slots (hidden until real)` · `feat(home): roadmap strip` | 16 |
| 33 | `feat/N-home-assemble` | Assemble Home | `feat(home): compose all sections and data-nav-theme` · `feat(home): FAQ from site.ts` · `feat(home): CTA and metadata` · `feat(home): CLS and LCP pass` | 14, 25, 27–32 |

### E. Products (9)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 34 | `feat/N-product-template` | Product page template | `feat(products): route with generateStaticParams` · `feat(products): hero, problem, steps, bento sections` · `feat(products): honest-limits block` · `feat(products): per-product metadata and JSON-LD` · `feat(products): waitlist slot` | 05, 11, 13 |
| 35 | `feat/N-product-joined` | Joined page | `feat(joined): content` · `feat(joined): unified-feed mockup with source chips` · `feat(joined): company-details drawer mockup` · `feat(joined): trademark footnote` | 34 |
| 36 | `feat/N-product-acorn` | Acorn page | `feat(acorn): content` · `feat(acorn): browser-frame autofill mockup` · `feat(acorn): review-before-submit step` · `feat(acorn): privacy and data-handling block` | 34 |
| 37 | `feat/N-product-sitelog` | SiteLog page | `feat(sitelog): content` · `feat(sitelog): photos + voice note → report mockup` · `feat(sitelog): weather, crew, progress, delays blocks` | 34 |
| 38 | `feat/N-product-toothledger` | ToothLedger page | `feat(toothledger): content` · `feat(toothledger): you-pay breakdown mockup` · `feat(toothledger): remaining-limit bar and waiting-period flags` · `feat(toothledger): split-across-years comparison` · `feat(toothledger): estimate-not-advice disclaimer` | 34, 16 |
| 39 | `feat/N-product-senioraiplans` | SeniorAIPlans page | `feat(senioraiplans): content in plain language` · `feat(senioraiplans): bill-explainer and scam-alert mockup` · `feat(senioraiplans): document shelf and weekly check-in` · `feat(senioraiplans): senior-friendly variant (larger type, higher contrast)` | 34 |
| 40 | `feat/N-product-trustdraft` | TrustDraft page | `feat(trustdraft): content` · `feat(trustdraft): questionnaire mockup with citations` · `feat(trustdraft): unsupported-answer flags and reviewer approval` | 34 |
| 41 | `feat/N-products-index` | `/products` index | `feat(products): index page with audience chips` · `feat(products): URL-synced filter` · `feat(products): empty and result states` | 15, 29, 34 |
| 42 | `feat/N-product-crosslinks` | Related products and compare | `feat(products): related-products strip` · `feat(products): "which is right for me" helper` · `feat(seo): ItemList JSON-LD on index` | 41 |

### F. Company pages and blog (7)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 43 | `feat/N-about-page` | About | `feat(about): hero and story` · `feat(about): values grid` · `feat(about): roadmap and team placeholder` · `feat(about): metadata` | 11, 13 |
| 44 | `feat/N-contact-page` | Contact page UI | `feat(contact): hero and channels cards` · `feat(contact): form with labels and error states` · `feat(contact): product-interest select` · `feat(contact): FAQ` | 14 |
| 45 | `feat/N-legal-pages` | Privacy and Terms | `feat(legal): privacy page (waitlist and contact data, Resend, analytics)` · `feat(legal): terms page` · `docs: legal pages are drafts pending counsel review` | 11 |
| 46 | `feat/N-blog-infrastructure` | Blog infrastructure | `build: MDX pipeline` · `feat(blog): frontmatter schema (zod) and loader` · `feat(blog): categories and reading time` · `feat(blog): RSS and sitemap entries` | 05 |
| 47 | `feat/N-blog-index` | Blog index and cards | `feat(blog): hero and featured post` · `feat(blog): PostCard with cursor badge, parallax and sweep` · `feat(blog): filter chips grid` · `feat(blog): remove dead "load more" (paginate only when needed)` | 15, 46 |
| 48 | `feat/N-blog-post` | Post template | `feat(blog): article layout (68ch)` · `feat(blog): table of contents` · `feat(blog): reading-progress bar` · `feat(blog): Article JSON-LD and related posts` · `feat(blog): single h1` | 46, 47 |
| 49 | `feat/N-blog-categories-seed` | Category routes and seed posts | `feat(blog): /blog/category/[cat] routes` · `docs(blog): 6 seed posts (one per product, no invented stats)` · `feat(blog): canonical and metadata` | 48 |

### G. API and forms (4)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 50 | `feat/N-api-infrastructure` | Shared API infrastructure | `feat(api): zod schemas` · `feat(api): honeypot and time-trap` · `feat(api): rate limit (per IP)` · `feat(api): Resend client` · `feat(api): JSON error format` | 08 |
| 51 | `feat/N-api-contact` | `POST /api/contact` | `feat(api): route with validation` · `feat(api): notification email to team` · `feat(api): auto-reply to sender` · `feat(api): graceful failure when Resend unset (static build)` | 50, 44 |
| 52 | `feat/N-api-waitlist` | `POST /api/waitlist` | `feat(api): route with product tag` · `feat(api): double-opt-in email` · `feat(api): duplicate handling` · `feat(api): consent field stored` | 50 |
| 53 | `feat/N-waitlist-form` | Waitlist form component | `feat(forms): WaitlistForm with states` · `feat(forms): accessible errors and live region` · `feat(forms): static-export fallback (mailto/disabled message)` · `feat(forms): wire into product pages and CTA` | 52, 34, 25 |

### J. AstraField: three.js star-field (3, new)

Runs after the smoke footer (#22) and **before the Home hero (#27)**, which consumes it. See §5.2.

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 71 | `build/71-three-setup` | three.js setup and lazy loader | `build: add three and @types/three` · `feat(webgl): capability and low-power detection hook` · `feat(webgl): dynamic-import wrapper with idle/in-view loading` · `feat(webgl): renderer lifecycle (resize, DPR cap, pause, dispose)` · `feat(webgl): static CSS star fallback component` | 67, 22 |
| 72 | `feat/72-astrafield-stars` | AstraField: star points and shader | `feat(astra): star buffer generation with palette and seeded random` · `feat(astra): points shader (soft sprites, twinkle, size attenuation)` · `feat(astra): slow drift and depth fade` · `feat(astra): pointer parallax with damping` · `feat(astra): reduced-motion and save-data paths` | 71 |
| 73 | `feat/73-astrafield-constellations` | AstraField: product constellations and budgets | `feat(astra): six constellation layouts and line segments` · `feat(astra): active-product highlight API (hover and focus)` · `feat(astra): context-sharing rule with the smoke footer` · `build(astra): bundle budget (≤200 KB gz) and perf check` · `docs: AstraField usage` | 72, 29 |

### I. Imagery (4)

Added after the Unsplash/Pexels decision. These run **after the shell (C) and before the pages that use the photos** so each page issue can reference a named image.

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 61 | `feat/N-image-manifest` | Image manifest, credits and `Photo` component | `feat(images): credits.json schema (zod) and slot registry` · `feat(images): Photo component with responsive WebP, alt rules, blur placeholder` · `feat(images): credits section in /about and docs on license rules` · `build(images): check:images fails on missing credit or duplicate use` | 02 |
| 62 | `feat/N-photos-home-about` | Source photos: Home and About | `feat(images): add Home stepper photos (4) with credits` · `feat(images): add About photos (3) with credits` · `feat(images): alt text and focal points` · `docs(images): license checks recorded` | 61 |
| 63 | `feat/N-photos-products` | Source photos: six product pages | `feat(images): Joined and Acorn photos` · `feat(images): SiteLog and ToothLedger photos (no identifiable faces)` · `feat(images): SeniorAIPlans and TrustDraft photos` · `docs(images): sensitive-context review` | 61 |
| 64 | `feat/N-photos-blog-misc` | Source photos: blog covers, 404, contact | `feat(images): 7 blog covers with credits` · `feat(images): 404 and contact backgrounds` · `build(images): run full pipeline and size budget` | 61 |

Pages that consume them (27–33, 35–40, 43, 47, 49, 26, 44) get one small extra commit each: `feat(<scope>): use <slot> photo`.

### H. Quality and launch (7)

| # | Branch | Issue | Planned commits | Depends |
|---|---|---|---|---|
| 54 | `feat/N-a11y-pass` | Accessibility pass | `feat(a11y): skip link and landmarks` · `feat(a11y): focus order and visible rings` · `feat(a11y): reduced-motion audit of every effect` · `feat(a11y): 44 px tap targets` · `docs: a11y checklist` | after D–F |
| 55 | `feat/N-unit-tests` | Unit tests | `build: add Vitest` · `feat(test): validation and rate-limit tests` · `feat(test): content-model tests (6 products, slugs unique)` · `feat(test): blog loader tests` · `ci: run tests inside the existing lint job` | 50, 46 |
| 56 | `ci/N-e2e-axe` | E2E smoke and axe in CI (**optional**) | `ci: Playwright config` · `ci: smoke test of every route` · `ci: axe checks` · `ci: folded into the "CI passed" gate` | 55 |
| 57 | `feat/N-performance-budget` | Performance pass | `feat(perf): font subsetting and preload` · `feat(perf): lazy WebGL and Lenis` · `feat(perf): bundle analysis and budget` · `feat(perf): CLS and LCP checks` | after D |
| 58 | `feat/N-redirects-security` | Redirects and security headers | `feat(routing): lowercase redirects` · `feat(security): CSP and headers` · `feat(routing): custom not-found handling` | 07 |
| 59 | `docs/N-copy-compliance-review` | Copy and compliance review | `docs: claims audit per product page` · `docs: disclaimers verified` · `docs: no-fabrication checklist` | after E |
| 60 | `docs/N-launch-checklist` | Launch checklist | `docs: Vercel env vars and Resend domain` · `docs: DNS and domain` · `docs: post-launch monitoring` | all |

---

## 7. Pipeline: build it, prove it, then use it

### 7.1 Your setup steps (before I push #3)

| Step | Where | Why |
|---|---|---|
| a. Create a **fine-grained PAT** for this repo: Contents, Pull requests, Issues = read/write; Workflows = read/write; Metadata = read. Save it as the repository secret **`GH_TOKEN`** | Settings → Secrets and variables → Actions | The default `GITHUB_TOKEN` can't start the next workflow after a merge (§7.2). I don't create or read tokens |
| b. Turn on **"Allow GitHub Actions to create and approve pull requests"** (and keep default workflow permissions read-only) | Settings → Actions → General | Lets the open-PR workflow work; today it's off |
| c. Leave **rulesets unimported** for now | Settings → Rules | The "CI passed" check doesn't exist yet |
| d. Later (when I ask): import the two ruleset JSONs from `.github/rulesets/`; connect Vercel with Production = `main` | Rules / Vercel | After the gate; Vercel isn't needed until launch (#60) |

### 7.2 What #3 builds (mirrors your described pipeline)

| Workflow | Behavior |
|---|---|
| **Open pull request** | On push to a branch named `feat|fix|docs|ci|build/<issue-number>-…` → opens a PR into `dev` (skips if one is open). A branch without a valid prefix or number is ignored. On push to `dev` → opens or updates `dev` → `main`, with a body that collects `Closes #N` from branch names and commit lines since `main`. Uses `GH_TOKEN` |
| **CI** | Triggers: every PR, pushes to `dev`/`main`, manual dispatch; older runs of the same ref are cancelled. Jobs: **detect-app** → **Lint and type check** (`npm ci`, lint, typecheck, `check:images`) · **Build** server + static (static sets `NEXT_OUTPUT=export`, builds WebP, checks `out/` has HTML, sitemap, icons, images and **no `out/api`**) · **actionlint** on workflow files · **CI passed**, the single required check, which posts/updates one PR summary comment |
| **Merge passing PR** | Runs only after a successful CI `workflow_run` for a PR; merge-commits when the head is still the validated SHA (`--match-head-commit`). Eligible pairs only: prefix branch → `dev`, and `dev` → `main` |
| **Dependabot** | Weekly npm and github-actions PRs; **not** auto-opened or merged by the workflows |

**Hardening I'm adding** (cheap and safe): least-privilege `permissions:` per job; actions pinned to a major tag (Dependabot keeps them fresh); `concurrency` groups; fork PRs never receive `GH_TOKEN`; Node from setup-node `latest`, with the version printed in the summary; and **no Actions deploy** (Vercel deploys from `main` through its Git connection).

**Bootstrap mode.** There's no `package.json` right now, so `npm ci` can't run. CI's **detect-app** step handles that:
- `package.json` exists → lint/type/build jobs run for real.
- `package.json` is missing **and** `.github/ci-bootstrap` exists → those jobs are *skipped*, and "CI passed" still goes green. This lets us prove the PR/merge mechanics with no site code.
- `package.json` is missing **and** the flag is absent → **CI fails**. This is the guard that would have caught commit `cd50005` deleting the scaffold.

**#67 deletes the flag**, so from then on CI is strict and the bootstrap path can't be used by accident.

**Manual merges (unavoidable once):** `merge-passing-pr` is read from the default branch, so it can't act until it's on `main`. So: #3's PR → `dev` is merged by you; the resulting first `dev` → `main` PR is merged by you; after that, everything is automatic. You merge, I don't.

### 7.3 Pipeline probes (the proof)

| Probe | What I do | Expected |
|---|---|---|
| **#68 happy path** | Push `docs/68-…` with a doc-only change | PR auto-opened into `dev` → CI green with one summary comment → auto-merged as a **merge commit** → `dev` push opens `dev` → `main` with `Closes #68` in the body → CI green → merged → **#68 closes by itself** |
| **#69 red CI** | Push `fix/69-…` whose commit removes the bootstrap flag | CI **fails**, "CI passed" fails, **no merge**. I push the fix; the stale run is **cancelled**; the new run passes and merges. This proves the failure path, recovery and concurrency cancel |
| **#70 guards** | After rulesets are imported | See §7.4 items 9–13 |

### 7.4 Gate checklist (all must pass before any site code)

| # | Check | Pass criterion |
|---|---|---|
| 1 | Prefixed branch opens a PR | `feat|fix|docs|ci|build/<n>-…` each opens a PR into `dev` (sampled: `docs/`, `fix/`, `ci/`) |
| 2 | Bad branch ignored | `wip/…` and a prefixed branch with no issue number get **no** PR |
| 3 | CI summary comment | Exactly one comment, updated, not duplicated |
| 4 | Green merges automatically | Merge commit on `dev`, branch head validated |
| 5 | `dev` push opens/updates `dev` → `main` | PR exists with correct `Closes` lines; no duplicate PR |
| 6 | `dev` → `main` merges after green CI | `main` has the merge commit; linked issues close |
| 7 | Red CI never merges | PR stays open; "CI passed" red |
| 8 | Newer push cancels older run | Stale run shows *cancelled* |
| 9 | Direct push to `dev` and `main` rejected | Rejected by ruleset (I try with a harmless commit) |
| 10 | Force-push and branch deletion rejected | Rejected on both |
| 11 | Merge without green "CI passed" blocked | Ruleset/required check blocks it |
| 12 | Non-merge-commit methods blocked | Squash/rebase merge options rejected by ruleset |
| 13 | Non-eligible pairs untouched | A feature → `main` PR isn't auto-merged |
| 14 | Head-moved race | Push a second commit right after CI starts: no merge on the old SHA (`--match-head-commit`) |
| 15 | Next workflow starts after a bot merge | The `dev` push run exists after step 4, which proves `GH_TOKEN` works |

Each check gets a run/PR link in a comment on #68/#69/#70 (not in the repo). A failed check creates a `ci/` fix branch off `dev` with its own commit, and re-runs the check.

### Execution order

Dependent issues must wait for their dependency to merge, because every branch starts from `origin/dev`. The order is:

`3 → 68 → 69 → [rulesets imported] → 70 → GATE → 67 → 2` · `4 ∥ 5 ∥ 8 ∥ 24` · `6 → 7 → 9` · primitives `10–17` · shell `18–26` · **AstraField `71 → 72`** · **imagery `61 → 62 ∥ 63 ∥ 64`** · Home `27–33` (`73` after `29`) · products `34–42` · company/blog `43–49` · API `50–53` · quality `54–60`.

Parallel branches are fine when they touch different files. `site.ts` and `globals.css` are edited only by 04 and 05, and each product has its own content file to avoid conflicts.

---

## 8. Edge cases and risks

| Risk | Mitigation |
|---|---|
| Ruleset blocks bootstrap | Rulesets are imported only after #3 and probes #68/#69 pass (§7) |
| Scaffold was deleted (`cd50005`) and CI could not have caught it | Strict CI (no `package.json` → fail) after #67; bootstrap flag only until then |
| `GH_TOKEN` PAT leaks or expires | Fine-grained, single repo, expiry noted in `docs/pipeline.md`; never exposed to fork PRs; I never print it |
| PAT owner can bypass rules | Rulesets have **no bypass list**, so even admins and the PAT go through PRs (verified in #70) |
| Auto-merge with no human review | Intentional per your design; the safety net is the required "CI passed", `--match-head-commit`, and the guard checks |
| Static export vs. WebGL | AstraField and the aurora footer render only on the client; the static build ships the CSS fallback HTML |
| three.js weight | Lazy-loaded, ≤ 200 KB gz budget (#73), Home only |
| Latest-Node drift in CI | Node version is printed in the CI summary; if a new Node breaks the build, pin in a `ci/` fix |
| Pasted pipeline doc belongs to another project (bridgewide.org, hire/CV/salary APIs) | Only the workflow mechanics are reused; routes and domain are replaced. **I need the real SmartxDreams domain** (default `NEXT_PUBLIC_SITE_URL` placeholder) |
| Static export has no `/api` | Forms degrade to a clear message in the static build; the server build (Vercel) sends via Resend |
| Waitlist emails are personal data | Consent checkbox, privacy page, minimal fields, no tracking pixels, honeypot |
| Spam and abuse | Honeypot, time-trap, per-IP rate limit, zod validation |
| Acorn and LinkedIn/Indeed terms of service on automation | Copy says "fills forms you review and submit"; **counsel should review before launch** (issue 59) |
| Seniors and dental: regulated-adjacent claims | Estimate/not-advice wording, no guarantees, reviewed in issue 59 |
| Full parity motion vs. performance | Lazy-load WebGL and Lenis, budgets in issue 57, everything off under reduced motion |
| Lenis and the page transition fight over scroll | Transition resets scroll through Lenis; tested in 23/24 |
| Dark header with an ink wordmark | Light wordmark variant (issue 06) |
| Brand-name collisions for the proposed product names | Verify trademarks and domains before finalizing (§3) |
| `check:images` requires each photo used once | ~27 distinct photos needed up front (§5.1); the check also fails on a missing credit (issue 61) |
| Stock-photo license and release limits | Unsplash/Pexels licenses only, credits recorded, no identifiable faces on health/insurance/senior pages, no brand logos in frame |
| Sites may block automated browsing or ask for sign-in | I stop and ask you; I don't bypass CAPTCHAs or log in for you |
| Large originals bloat the repo | Commit resized masters (~300–600 KB) only |
| Dependabot PRs aren't auto-merged | A person merges them |
| 60 merges = 60 `dev` → `main` cycles | `main` only re-runs CI; Vercel redeploys per merge. If that's too noisy I can batch with a longer-lived epic branch, but that breaks "one issue = one branch to dev" |

### Defaults I'll use unless you say otherwise
- Sender address `hello@<your-domain>`; team notification goes to a `CONTACT_TO_EMAIL` env var.
- Social icons: placeholders, hidden until you supply URLs.
- Team section: placeholder cards ("Founders", "Builders"), no invented people.
- Blog: 6 seed posts of original copy (one per product), clearly marked as draft until you edit.
- Language: English only.

---

## 9. What happens after you approve

1. I create the 7 new issues **#67–#73** (labels `epic:*`) and update #2 and #3 to match this plan. The other 62 issues already exist.
2. I tell you when to do the §7.1 setup (token + settings), then push **#3** (`ci/3-github-workflows`) with its commits. Each commit carries the three trailers.
3. **Your manual merges:** the #3 PR into `dev`, then the first `dev` → `main` PR. I stop and wait for those.
4. I run probes **#68 → #69**, then ask you to import the rulesets, then run **#70**. I report the §7.4 checklist.
5. **If all 15 checks pass I continue on my own** with #67, then #2 and the rest in the order above. Each issue: fresh branch from `origin/dev`, the planned commits, push, let the workflows open the PR, wait for CI and the merge, then start the next dependent issue. If a check fails I fix it through a `ci/` issue first.
6. Deleting your duplicate favicon set and zips (issue #6) happens only after you say yes.
