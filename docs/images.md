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
- Every registered slot is used exactly once (`slot="<id>"`) in `src/`. A photo can be registered ahead of its page with `"pending": true`; it may stay unused until the page issue removes the flag, and using a pending slot fails the check.
- Nothing in `src/` points at `/images/...` directly; photos go through `<Photo slot />`.

## Credits

`<PhotoCredits />` lists every registered photo with its photographer and source. It is shown on the About page.

## License log

Each photo page was opened on the date shown and checked for: the plain Unsplash License (not Unsplash+), no editorial-only note, no visible brand names or logos, and no identifiable faces where the page is sensitive. Masters are 2400 px on the long side.

| Slot | Photo | Photographer | Checked | Notes |
|---|---|---|---|---|
| `home-step-1` | [ajTN690FnUg](https://unsplash.com/photos/ajTN690FnUg) | Beatriz Cattel | 2026-11-16 | Hand and marker on glass; no faces, no brands |
| `home-step-2` | [5Q07sS54D0Q](https://unsplash.com/photos/5Q07sS54D0Q) | Kvalifik | 2026-11-16 | Writing on glass, face out of frame |
| `home-step-3` | [ieic5Tq8YMk](https://unsplash.com/photos/ieic5Tq8YMk) | Chris Ried | 2026-11-16 | Code on a screen; no brands |
| `home-step-4` | [jdS1UfbbIA8](https://unsplash.com/photos/jdS1UfbbIA8) | Mina Rad | 2026-11-16 | Hands on a laptop; no visible logo |
| `about-story` | [VXpeQ3GetDU](https://unsplash.com/photos/VXpeQ3GetDU) | Huy Phan | 2026-11-16 | Desk with laptop and monitor; no prominent logos |
| `about-values` | [qWwpHwip31M](https://unsplash.com/photos/qWwpHwip31M) | Alvaro Reyes | 2026-11-16 | Hand on a planning board |
| `about-team` | [26MJGnCM0Wc](https://unsplash.com/photos/26MJGnCM0Wc) | Kaleidico | 2026-11-16 | Two people at a whiteboard, faces out of frame |

Rejected: [C5GeaRZp2D4](https://unsplash.com/photos/C5GeaRZp2D4) (social network names and a company logo on the board) and [IisDPFNUS4k](https://unsplash.com/photos/IisDPFNUS4k) (laptop maker logo in the centre).
