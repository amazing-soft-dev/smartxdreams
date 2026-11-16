# Design tokens

Tokens live in `src/app/globals.css` (`@theme`, Tailwind CSS v4) and, for JavaScript motion, in `src/styles/motion.ts`. Brand colors are sampled from the logo files in `public/`.

## Colors

| Token | Value | Use |
|---|---|---|
| `ink` | `#0F1226` | Text on light surfaces, dark heroes, transition panels |
| `ink-800` / `-700` / `-600` | `#1B1F3A` / `#2A2F52` / `#3D4370` | Raised dark surfaces |
| `canvas` | `#F5F2EE` | Page background |
| `canvas-200` | `#ECE7E1` | Alternate light section |
| `violet-500` | `#6D4AFF` | Brand violet: accents, links, focus ring |
| `coral-500` | `#FF6B3D` | Brand coral: primary buttons, highlights |

Violet and coral each have a 50 to 900 scale, with the brand color at 500.

## Contrast (WCAG 2.x)

Computed from the token values. "AA" means 4.5:1 for normal text; "UI / large" means 3:1, which is enough for large text (24 px, or 18.66 px bold) and for focus rings, borders and icons, but **not** for body text.

| Foreground on background | Ratio | Result | Rule |
|---|---|---|---|
| ink on canvas | 16.58:1 | AAA | Default text |
| ink on white | 18.51:1 | AAA | |
| white on ink | 18.51:1 | AAA | Text on dark heroes |
| ink at 65% on canvas | 5.54:1 | AA | **Muted text: use ink/65 or darker** |
| ink at 60% on canvas | 4.69:1 | AA (barely) | Avoid for small text |
| white at 60% on ink | 7.12:1 | AAA | Muted text on dark |
| violet-500 on canvas | 4.62:1 | AA | Links and accent words on light |
| violet-500 on white | 5.15:1 | AA | |
| white on violet-500 | 5.15:1 | AA | Violet buttons |
| violet-600 on canvas | 6.06:1 | AA | Hover state for violet text |
| violet-300 on ink | 7.56:1 | AAA | **Accent words on dark** |
| violet-500 on ink | 3.59:1 | UI / large only | Not for text on dark |
| ink on coral-500 | 6.54:1 | AA | **Coral buttons use ink text** |
| white on coral-500 | 2.83:1 | **Fails** | Never use |
| coral-500 on canvas | 2.54:1 | **Fails** | Never use coral-500 for text on light |
| coral-700 on canvas | 4.77:1 | AA | Coral text on light |
| coral-400 on ink | 7.66:1 | AAA | Coral text on dark |
| coral-300 on ink | 9.38:1 | AAA | |

**Focus ring:** 2 px `violet-500` with a 3 px offset on light surfaces; inside `[data-surface="dark"]` it switches to `violet-300`.

## Type

Inter Tight (variable) via `next/font`, exposed as `--font-inter-tight`. Headings use weight 400. Sizes are fluid between 390 px and 1440 px viewports:

| Token | Size | Line height |
|---|---|---|
| `text-display` | 44 → 68 px | 1.1, tracking -0.02em |
| `text-h2` | 34 → 52 px | 1.2 |
| `text-h3` | 28 → 40 px | 1.2 |
| `text-h4` | 24 → 32 px | 1.25 |
| `text-h5` | 24 px | 1.4 |
| `text-h6` | 20 px | 1.5 |
| `text-body-l` | 18 px | 1.5 |
| `text-body` | 16 px | 1.5 |
| `text-label` | 14 px | 1.43 |
| `text-micro` | 12 px (mono labels) | 1.5 |

Every page has exactly one `<h1>` at every width. Visual size comes from these classes, never from the heading level.

## Layout, shape, elevation

- Breakpoints: `md` 810 px (tablet), `lg` 1024 px (desktop navigation), `xl` 1440 px. Content width 1280 px.
- Radius: field 12, tag 12, button 16, menu 20, card 30.
- Shadows: `shadow-tag` (five soft layers), `shadow-card-hover`, `shadow-menu`.

## Motion

| Easing | Curve | Use |
|---|---|---|
| `panel` | `cubic-bezier(.76,0,.24,1)` | Page-transition panels, rolling labels |
| `out-quint` | `cubic-bezier(.22,1,.36,1)` | Entrances, menus, card lifts |
| `in-out-cubic` | `cubic-bezier(.65,0,.35,1)` | Header hide |
| `out-expo` | `cubic-bezier(.16,1,.3,1)` | Header re-show |
| `back` | `cubic-bezier(.34,1.56,.64,1)` | Button release, checklist pop |
| `standard` | `cubic-bezier(.4,0,.2,1)` | Sweeps, link colour |

Springs (Motion): **A** bounce 0.2, 0.6 s for text and button reveals; **B** bounce 0.3, 1.1 s for hero cards.

Under `prefers-reduced-motion: reduce`, CSS animations and transitions are cut to a single frame, and every JavaScript effect must check the same query.
