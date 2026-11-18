# Brand assets

The SmartxDreams mark is an **SD ribbon**: one shaded band that folds into an S at the top and a D around it. It comes as two raster masters, one for each kind of surface. There is no wordmark artwork: where the name appears next to the mark, it is live text (see [Full logo](#full-logo)).

## Masters and naming

Pick the mark by the surface it sits **on**, never by preference. The files are named that way (as press kits such as Stripe's, Vercel's and Linear's are), so "dark" never has to be guessed: `on-light` is the charcoal ribbon, `on-dark` the white one.

| Master (`assets/brand/`) | Ribbon | Use on | Contrast |
|---|---|---|---|
| `smartxdreams-mark-on-light.png` | charcoal, mean `#252628` | Canvas, white and other light surfaces | about 13.5:1 on canvas |
| `smartxdreams-mark-on-dark.png` | white with cool shading, mean `#E7ECF8` | Ink, dark heroes, photos with a dark overlay | about 15:1 on ink |

Both are 1254 x 1254 PNGs on transparency, as the SmartxDreams team supplied them. They live in `assets/`, which is **not served**: everything in `public/` is copied into the static export, so the site only ships the small files built from them.

These are logo colours only. The UI palette (`violet-500` `#6D4AFF`, `coral-500`, `ink`) lives in [design-tokens.md](design-tokens.md).

## Building the files

```bash
npm run brand          # write every file below from the masters
npm run check:brand    # fail if one is missing or no longer the size its master gives (runs in CI)
```

`scripts/build-brand.mjs` first **cleans** each master: the generator that drew the marks left faint specks around and inside the ribbon (60 on the charcoal master, over 100 on the white one). It keeps the solid parts (alpha 128 or more, at least 0.5% the size of the largest part), keeps the anti-aliased edge within 3 px of them, clears everything else, and trims the image to what is left. A height in px is therefore the height of the artwork: the charcoal ribbon is 943 x 804 master pixels, the white one 863 x 750. Nothing is ever upscaled, and no file may exceed 80 KB.

| Built file | What |
|---|---|
| `public/brand/logo/smartxdreams-mark-on-{light,dark}-{32,64,128,256,512}.webp` | The mark at five widths, the `Logo` component's srcset |
| `public/brand/logo/smartxdreams-mark-on-{light,dark}-512.png` | 256-colour PNGs for renderers without WebP (the social card) |
| `public/brand/logo/smartxdreams-mark-on-light-square-512.png` | The charcoal mark centred on a transparent 512 px square: the organisation logo |
| `public/brand/icons/favicon.ico` | 16, 32 and 48 px PNG entries, charcoal mark |
| `public/brand/icons/favicon-{16x16,32x32}.png` | Charcoal mark, 96% of the square so it reads at 16 px |
| `public/brand/icons/android-chrome-{192x192,512x512}.png` | Charcoal mark on transparency |
| `public/brand/icons/apple-touch-icon.png` | 180 px, white mark on **opaque** ink (iOS fills transparency with black) |
| `public/brand/icons/maskable-512x512.png` | White mark on opaque ink, inside the central 80% circle Android may crop to |
| `src/app/favicon.ico`, `src/app/apple-icon.png` | Copies of the two icons above, served by Next.js file conventions |
| `src/app/icon.svg` | Both marks as 64 px PNGs with a `prefers-color-scheme` rule: charcoal on light tabs, white on dark |
| `src/lib/brand-marks.json` | Each mark's trimmed size and the built widths, so `Logo` knows the aspect ratio without loading the file |

## Files

### Earth plate (`public/brand/earth/`)

"Cloud-Formed Emblem Over Earth": a painted view of the Earth from orbit, with the sun rising on the upper-left limb, a cyclone at the top right and the SmartxDreams emblem formed in clouds right of centre. It is the Home hero backdrop's texture: the WebGL scene animates it, and the CSS fallback shows it still. Supplied by the SmartxDreams team as a 1659 x 948 PNG, kept as the master at `public/brand/Cloud-Formed Emblem Over Earth.png` (the site never loads it; it serves the variants below).

| File | Size | Use |
|---|---|---|
| `earth-emblem-1659.webp` | 1659 x 948, quality 82, 227 KB | Master width; large and high-density screens |
| `earth-emblem-1200.webp` | 1200 x 686, quality 80, 126 KB | Laptops and tablets |
| `earth-emblem-768.webp` | 768 x 439, quality 78, 53 KB | Phones |
| `earth-emblem-mask.png` | 415 x 237, greyscale, 15 KB | Distance from the cloud emblem's strokes: carries the plate near the emblem with its slow drift (see [earth.md](earth.md#the-plate-platets)) |

It is brand artwork, not a stock photo, so it lives here and not in `public/images` (which holds only credited Unsplash and Pexels photos used through `<Photo>`; see [images.md](images.md)). To regenerate the variants from a new master PNG:

```bash
node scripts/build-earth-plate.mjs [path/to/master.png]
```

The script never upscales (the widest variant is the master's width) and fails if a file goes over 800 KB (the photo budget). If the new art moves the limb, the sun, the cyclone or the emblem, measure them again (`node scripts/measure-earth-plate.mjs`, see [earth.md](earth.md#plate-geometry)) for the hero layout.  The emblem mask is built from the emblem's strokes, traced as centre lines in `src/components/earth/emblem-strokes.json`: if the emblem moves, re-trace them there and run the script again.

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
| Search results (Organization JSON-LD) | `smartxdreams-dark.png` | dark mark on white |

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
