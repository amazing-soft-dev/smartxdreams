# Images

Photos come from **Unsplash** and **Pexels** only. Product hero visuals are code-built mockups, not photos.

## License rules

- Accept only photos under the [Unsplash License](https://unsplash.com/license) or the [Pexels License](https://www.pexels.com/license/). Both allow free commercial use without required attribution; we credit every photographer anyway.
- Before downloading, read the photo page. Skip anything marked editorial-only, or that shows a recognisable brand, logo or trademark.
- **No identifiable faces** on the seniors, dental, insurance and job-search pages. Use hands, backs, over-the-shoulder shots or objects, so no real person appears to use or endorse a product. Both licenses restrict that kind of use.
- Do not use photos to imply endorsement by the photographer, Unsplash or Pexels.

## Adding a photo

1. Download the original from the photo page's own download button.
2. Resize to at most 2400 px on the long side (quality about 80) and save it under `public/images/<area>/<slot>.jpg`. Commit the resized master, not the 5 to 10 MB original.
3. Run `node scripts/photo-meta.mjs public/images/<area>/<slot>.jpg` and copy its output (width, height, tint, blurDataURL) into a new entry in `src/content/photos.json`, with:
   - `slot`: a kebab-case id, for example `home-step-1`
   - `src`: the public path, `/images/<area>/<slot>.jpg`
   - `alt`: what the photo shows, for screen readers; or `"decorative": true` with an empty `alt`
   - `credit`: photographer name, profile URL, photo URL, `source` (`unsplash` or `pexels`) and `license` (`Unsplash License` or `Pexels License`)
4. Use it once, with `<Photo slot="<slot>" sizes="..." />`.
5. Run `npm run images` (WebP variants for the static export) and `npm run check:images`.

## What `npm run check:images` enforces

- Every file in `public/images` has exactly one registry entry with a credit, and every entry points to a file that exists.
- Every registered slot is used exactly once (`slot="<id>"`) in `src/`.
- Nothing in `src/` points at `/images/...` directly; photos go through `<Photo slot />`.

## Credits

`<PhotoCredits />` lists every registered photo with its photographer and source. It is shown on the About page.
