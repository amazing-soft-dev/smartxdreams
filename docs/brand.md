# Brand assets

The SmartxDreams symbol is an **S** (top) and a **D** (bottom) drawn as two strokes that pass over and under each other. It comes in two colourways, one for each kind of surface. There is no wordmark artwork: where the name appears next to the symbol, it is live text (see [Full logo](#full-logo)).

## Colourways

Pick the colourway by the surface the symbol sits on, never by preference. The wrong one nearly disappears: the navy S on the ink background is 1.37:1, the lavender S on the canvas background 2.13:1.

| Colourway | Use on | S stroke | D stroke | Contrast |
|---|---|---|---|---|
| **light-bg** | Canvas, white and other light surfaces | `#2B2170` navy | `#6E56F0` violet | S 12.11:1, D 4.43:1 on canvas |
| **dark-bg** | Ink, dark heroes, photos with a dark overlay | `#A99BFF` lavender | `#E6E1FF` pale lavender | S 7.77:1, D 14.61:1 on ink |

Both strokes clear the 3:1 that WCAG asks of graphics on their intended surface.

These are logo colours only. The UI palette (`violet-500` `#6D4AFF`, `coral-500`, `ink`) lives in [design-tokens.md](design-tokens.md) and is separate; do not use the logo hex values for buttons, links or text.

## Files

### Masters (`public/brand/`)

| File | Colourway | Format | Used by |
|---|---|---|---|
| `smartxdreams-dark-1x1-transparent.png` | dark mark, for light surfaces | PNG 1254 x 1254, transparent | Organization logo in the JSON-LD (`organizationLogoPath` in `src/lib/seo.ts`) |
| `smartxdreams-white-1x1-transparent.png` | white mark, for dark surfaces | PNG 1254 x 1254, transparent | Social card (`src/app/opengraph-image.tsx`) |

The header, footer and page transition still draw the stroke symbol in code (`src/lib/brand-symbol.ts` and `src/app/icon.svg`), not from these PNGs. The gaps where those strokes cross are cut with `<mask>` and `<clipPath>`; keep those if you redraw that symbol, or the weave turns into a plain overlap.

### Earth plate (`public/brand/earth/`)

"Cloud-Formed Emblem Over Earth": a painted view of the Earth from orbit, with the sun rising on the upper-left limb, a cyclone at the top right and the SmartxDreams emblem formed in clouds right of centre. It is the Home hero backdrop's texture: the WebGL scene animates it, and the CSS fallback shows it still. Supplied by the SmartxDreams team as a 1659 x 948 PNG, kept as the master at `public/brand/Cloud-Formed Emblem Over Earth.png` (the site never loads it; it serves the variants below).

| File | Size | Use |
|---|---|---|
| `earth-emblem-1659.webp` | 1659 x 948, quality 82, 227 KB | Master width; large and high-density screens |
| `earth-emblem-1200.webp` | 1200 x 686, quality 80, 126 KB | Laptops and tablets |
| `earth-emblem-768.webp` | 768 x 439, quality 78, 53 KB | Phones |

It is brand artwork, not a stock photo, so it lives here and not in `public/images` (which holds only credited Unsplash and Pexels photos used through `<Photo>`; see [images.md](images.md)). To regenerate the variants from a new master PNG:

```bash
node scripts/build-earth-plate.mjs [path/to/master.png]
```

The script never upscales (the widest variant is the master's width) and fails if a file goes over 800 KB (the photo budget). If the new art moves the limb, the sun, the cyclone or the emblem, measure them again (`node scripts/measure-earth-plate.mjs`, see [earth.md](earth.md#plate-geometry)) for the hero layout.

### Icon sets (`public/brand/smartxdreams-{dark,white}-1x1-transparent/`)

Generated from the raster masters, one folder per colourway:

| File | Size |
|---|---|
| `favicon.ico` | 16, 32, 48 |
| `favicon-16x16.png`, `favicon-32x32.png` | 16, 32 |
| `apple-touch-icon.png` | 180 |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | 192, 512 |

The generator also writes a `site.webmanifest`. Do not add it: its name is empty and its icon paths point at the site root. `src/app/manifest.ts` writes the real manifest.

## Where each asset appears

| Place | Asset | Colourway |
|---|---|---|
| Header on a light section | `<Logo tone="dark">` | light-bg |
| Header on a dark hero, mobile menu, footer | `<Logo tone="light">` | dark-bg |
| Page transition | `<Logo variant="mark" tone="light">` | dark-bg |
| Browser tab (Chrome, Edge, Firefox) | `src/app/icon.svg` | light-bg, dark-bg in dark mode |
| Browser tab fallback | `src/app/favicon.ico` (copy of the dark-mark `favicon.ico`) | dark mark |
| iOS home screen | `src/app/apple-icon.png` (copy of the white-mark `apple-touch-icon.png`) | white mark: iOS fills transparency with black |
| Installed app (manifest) | dark-mark `android-chrome-192x192.png` and `-512x512.png`, plus `/icon.svg` | dark mark, on `background_color` `#F5F2EE` |
| Link previews | `/opengraph-image` | white mark on ink |
| Search results (Organization JSON-LD) | `smartxdreams-dark-1x1-transparent.png` | dark mark on white |

## The `Logo` component

`src/components/ui/Logo.tsx` draws everything inline (no request, sharp at every size).

| Prop | Default | Meaning |
|---|---|---|
| `variant` | `"full"` | `"full"`: symbol and wordmark. `"mark"`: symbol alone |
| `tone` | `"dark"` | Colour of the **artwork**: `"dark"` for light surfaces (light-bg colourway), `"light"` for dark surfaces (dark-bg colourway) |
| `height` | `32` | Height in px of the symbol; the wordmark scales with it |
| `label` | `"SmartxDreams"` | Accessible name |
| `decorative` | `false` | Hide from assistive technology, when a link or text next to it already names the company |

The mark's viewBox (`216 116 168 273`) is cropped to the strokes, so `height` is the height of the artwork. Mask and clip-path ids come from `useId()`, so any number of logos can share a page.

### Full logo

The wordmark is "Smart**x**Dreams" in Inter Tight, weight 600, at 0.6 x `height`, with a gap of 0.3 x `height` after the symbol. The text takes the S colour and the "x" the D colour of the same colourway (`#2B2170` and `#6E56F0` on light, `#E6E1FF` and `#A99BFF` on dark). The whole logo is one `role="img"`; the text inside is hidden from screen readers so the name is not read twice.

## Clear space and minimum size

- **Clear space:** keep at least half the symbol's width free on every side. Nothing else (text, edges, other marks) goes inside it.
- **Minimum size:** symbol 16 px tall on screen; full logo `height` 20 px. Below that the gaps in the weave close up. For the 16 px favicon the symbol is drawn edge to edge on purpose.

## Don'ts

- Do not put the light-bg colourway on a dark surface or the dark-bg colourway on a light one.
- Do not recolour, outline, add shadows to or rotate the symbol, or swap the S and D colours.
- Do not fill the gaps where the strokes cross.
- Do not set the wordmark in another typeface or as an image; use `<Logo>`.
- Do not use third-party logos anywhere on the site (see [compliance.md](compliance.md)).

## Changing the symbol

1. Replace the two raster masters in `public/brand/` and both icon-set folders, keeping the file names.
2. If the stroke symbol's geometry changed, update `SYMBOL` in `src/lib/brand-symbol.ts` (used by `Logo`; the cloud emblem in the [Earth plate](#earth-plate-publicbrandearth) is painted and would need new art) and the paths in `src/app/icon.svg`. If the raster mark's bounds changed, update `SYMBOL_BOX` in `src/app/opengraph-image.tsx` (the artwork's bounding box in the 1254 px PNG).
3. Copy the dark-mark `favicon.ico` to `src/app/favicon.ico` and the white-mark `apple-touch-icon.png` to `src/app/apple-icon.png`.
4. If the colours changed, update `SYMBOL_COLORS` and `WORDMARK_COLORS` in `Logo.tsx`, the `<style>` in `icon.svg`, and the tables on this page.
5. Run `npm test` (Logo, manifest and Organization logo tests) and, for the static export, `NEXT_OUTPUT=export npm run build && npm run verify:out`.
