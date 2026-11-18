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

| Place | Asset | Mark |
|---|---|---|
| Header bar | `<Logo>` twice, both tones stacked; the one that suits the section behind (`useNavTheme`) is shown and they cross-fade | charcoal on light sections, white on dark |
| Mobile menu | `<Logo tone="light">`, same height as the header (`NAV_LOGO_HEIGHT`) | white |
| Footer | `<Logo tone="light" height={30}>` with a soft ink shadow against the aurora | white |
| Page transition | `<Logo variant="full" tone="light" height={28}>` above the destination name, decoded while idle, fading in as the panels close | white, violet x |
| Browser tab (Chrome, Edge, Firefox, Safari 18+) | `src/app/icon.svg` | charcoal, white in dark mode |
| Browser tab fallback | `src/app/favicon.ico` | charcoal |
| iOS home screen | `src/app/apple-icon.png` | white on opaque ink |
| Installed app (manifest) | `android-chrome-192x192.png`, `-512x512.png`, `maskable-512x512.png`, `/icon.svg` | charcoal on `background_color` `#F5F2EE`; maskable white on ink |
| Link previews | `/opengraph-image` reads `smartxdreams-mark-on-dark-512.png` | white on ink |
| Search results (Organization JSON-LD) | `smartxdreams-mark-on-light-square-512.png` (`organizationLogoPath` in `src/lib/seo.ts`) | charcoal on white |

## The `Logo` component

`src/components/ui/Logo.tsx` draws the mark as an `<img>` of the built files, with every width in its srcset so the browser picks the sharpest one for the screen.

| Prop | Default | Meaning |
|---|---|---|
| `variant` | `"full"` | `"full"`: mark and wordmark. `"mark"`: the ribbon alone |
| `tone` | `"dark"` | Colour of the **artwork**: `"dark"` for light surfaces (the on-light file), `"light"` for dark surfaces (the on-dark file) |
| `height` | `32` | Height in px of the mark; the wordmark scales with it |
| `label` | `"SmartxDreams"` | Accessible name |
| `decorative` | `false` | Hide from assistive technology, when a link or text next to it already names the company |

`width` and `height` attributes come from `brand-marks.json`, so the box is reserved before the file arrives and nothing shifts. React hoists a `<link rel="preload">` for each eager logo, so the header's marks load with the document.

### Full logo

The wordmark is "Smart**x**Dreams" in Inter Tight, weight 600, at 0.6 x `height`, with a gap of 0.3 x `height` after the mark. On light surfaces it is ink `#0F1226` with the "x" in violet `#6D4AFF`; on dark surfaces white with the "x" in `#AA97FF`. The whole logo is one `role="img"`; the text inside is hidden from screen readers so the name is not read twice.

## Clear space and minimum size

- **Clear space:** keep at least half the mark's width free on every side. Nothing else (text, edges, other marks) goes inside it.
- **Minimum size:** mark 16 px tall on screen; full logo `height` 20 px. Below that the gap between the S and the D closes up. For the 16 px favicon the mark is drawn nearly edge to edge on purpose.

## Don'ts

- Do not put the on-light (charcoal) mark on a dark surface or the on-dark (white) mark on a light one.
- Do not recolour, outline, rotate or stretch the mark; its shading is part of it.
- Do not use a raw master on the site: masters carry stray specks and padding. Use the built files.
- Do not set the wordmark in another typeface or as an image; use `<Logo>`.
- Do not use third-party logos anywhere on the site (see [compliance.md](compliance.md)).

## Product logos

`<ProductLogo product={...} />` draws a product's logo from `public/products/logos/<slug>-<size>.webp` (built by `npm run brand` from `assets/products/<slug>.png`). Wherever the surface may be dark (the nav menus, the dark product cards), the logo sits on a rounded square tile, like an app icon, because several logos are black or navy. Each product picks its tile in its content file, as `logo.tile`:

| Product | `logo.tile` | Why |
|---|---|---|
| Acorn | `{ background: "#F7EFE4" }` | warm cream, from the brown leaf |
| Joined | `{ background: "#FFECEC" }` | pale red, from the pin |
| SeniorAIPlans | `{ background: "#FFF1E6" }` | peach, from the orange figure |
| SiteLog | `{ background: "#FFF6D1" }` | pale yellow, from the hard hat |
| TrustDraft | `{ background: "#E3F5FA" }` | pale cyan, from the teal figure |
| ToothLedger | `"none"` | the artwork already is a blue rounded-square icon |

- A tile colour stays light (a pale tint of the logo's own colour), so dark artwork keeps its contrast on ink.
- The artwork fills 72% of the tile. With `"none"` it is drawn edge to edge at the tile's size, with a drop shadow that follows its own corners. Never put an app-icon logo on a second square.
- `tileBackground` overrides the colour for one use. It is ignored for a `"none"` logo.
- `tile={false}` gives the bare artwork, for light surfaces only (the inline logos in the home statement).

## Changing the mark

1. Replace the masters in `assets/brand/`, keeping the file names (`smartxdreams-mark-on-light.png`, `smartxdreams-mark-on-dark.png`).
2. Run `npm run brand`. It rewrites every file in the table under [Building the files](#building-the-files), including `brand-marks.json`, so the logo's aspect ratio and the social card follow by themselves.
3. Look at the results on both surfaces: a new master may carry new specks or a different kind of edge. If parts of the mark go missing or specks survive, adjust `SOLID`, `MIN_PART` or `EDGE` at the top of the script.
4. If the colours changed, update `WORDMARK_COLORS` in `Logo.tsx` and the tables on this page.
5. Run `npm test` (Logo, logo files, manifest and Organization logo tests), `npm run check:brand` and, for the static export, `NEXT_OUTPUT=export npm run build && npm run verify:out`.

The cloud emblem in the [Earth plate](#earth-plate-publicbrandearth) is painted art and needs a new master of its own.
