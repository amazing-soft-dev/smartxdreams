# assets

Source art that is **not served**. Everything under `public/` is copied into the static export as is, so
full-size masters live here and `npm run brand` (`scripts/build-brand.mjs`) writes the small files the site
actually loads into `public/`.

| Folder | What | Built into |
| --- | --- | --- |
| `brand/` | The SmartxDreams mark, one master per background: `smartxdreams-mark-on-light.png` (charcoal ribbon, for light surfaces) and `smartxdreams-mark-on-dark.png` (white ribbon, for dark surfaces). 1254 px squares on transparency. | `public/brand/logo/`, `public/brand/icons/`, the app icons in `src/app/` |
| `products/` | One logo per product, named by its slug (`joined.png`, `acorn.png`, `senioraiplans.png`, `sitelog.png`, `toothledger.png`, `trustdraft.png`). 1254 px squares on transparency, as the SmartxDreams team supplied them. | `public/products/logos/` |

Masters are named by the background they sit **on**, not by their own colour, so "dark" never has to be
guessed. See `docs/brand.md`.
