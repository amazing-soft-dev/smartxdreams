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

## Variants for the static export

The server build resizes photos on request with the Next.js optimizer. The static export (`NEXT_OUTPUT=export`) has no server, so `npm run images` pre-builds WebP variants into `public/_img` (generated, not committed) and `src/lib/image-loader.ts` picks one per request.

- Widths come from `widths` in `src/lib/image-config.json`: **320, 640, 1024, 1600 and 2400 px**. The build script, the loader, `npm run verify:out` and the export's `deviceSizes` all read that list, so a width is added or removed in that file only.
- The loader serves the smallest variant at least as wide as the browser asks for, and the 2400 px one above that. A smaller original is never upscaled.
- The 320 px variant is for small images: thumbnails such as the photo credits (64 px, so 128 px on a 2x screen) and narrow cards. Without it they would each download the 640 px file.
- `src/lib/image-loader.test.ts` covers the rounding.

## What `npm run check:images` enforces

- Every file in `public/images` has exactly one registry entry with a credit, and every entry points to a file that exists.
- Every registered slot is used exactly once (`slot="<id>"`) in `src/`. A photo can be registered ahead of its page with `"pending": true`; it may stay unused until the page issue removes the flag, and using a pending slot fails the check.
- Nothing in `src/` points at `/images/...` directly; photos go through `<Photo slot />`.

## Credits

`<PhotoCredits />` lists every registered photo with its photographer and source. It is shown on the About page.

Each credit shows a 64 × 48 px thumbnail of the photo it credits, so readers can match a credit to a picture even when the photo lives on another page. The thumbnail is rendered by `<Photo slot={photo.slot} />` from the registry entry, so it gets the blur preview and lazy loading like any other photo. It does not count as a use for `npm run check:images` (only a literal `slot="<id>"` does), and it is hidden from screen readers: the photo's alt text belongs where the photo is used, and here the credit text is what matters.

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
| `product-joined` | [Hcfwew744z4](https://unsplash.com/photos/Hcfwew744z4) | Christin Hume | 2026-11-16 | Hands on a laptop; no face, no visible logo |
| `product-acorn` | [vZJdYl5JVXY](https://unsplash.com/photos/vZJdYl5JVXY) | Kaitlyn Baker | 2026-11-16 | Hands typing; no face, no visible logo |
| `product-sitelog` | [dSjrv4w1g1Q](https://unsplash.com/photos/dSjrv4w1g1Q) | Toni Reed | 2026-11-16 | Site from above; one distant worker, not identifiable; resized to 2000 px |
| `product-toothledger` | [Vs6ip7fsld8](https://unsplash.com/photos/Vs6ip7fsld8) | Aaron Lefler | 2026-11-16 | Calculator and notes; dental page, so no people at all |
| `product-senioraiplans` | [bXJjWbD9VOY](https://unsplash.com/photos/bXJjWbD9VOY) | Beth Macdonald | 2026-11-16 | Seniors page: a hand and glasses only, no face |
| `product-trustdraft` | [OnI_TNcIv9U](https://unsplash.com/photos/OnI_TNcIv9U) | Tyler | 2026-11-16 | Server rack; no brand markings readable |
| `blog-studio` | [t5YUoHW6zRo](https://unsplash.com/photos/t5YUoHW6zRo) | Barn Images | 2026-11-16 | Tool rack; no brand names readable |
| `blog-job-search` | [q10VITrVYUM](https://unsplash.com/photos/q10VITrVYUM) | Jess Bailey | 2026-11-16 | Keyboard, pens, notepad, glasses; no logo visible |
| `blog-autofill` | [weJ7qyjHYwk](https://unsplash.com/photos/weJ7qyjHYwk) | Jakub Żerdzicki | 2026-11-16 | A hand ticking a checklist; no face |
| `blog-site-report` | [eyq7H7gO0EY](https://unsplash.com/photos/eyq7H7gO0EY) | Michael Bader | 2026-11-16 | Rebar against the sky; no people, no logos. Replaced a site photo whose silo showed a company logo |
| `blog-dental` | [e7MJLM5VGjY](https://unsplash.com/photos/e7MJLM5VGjY) | Benyamin Bohlouli | 2026-11-16 | Empty treatment room; dental page, so no people |
| `blog-scams` | [uGcDWKN91Fs](https://unsplash.com/photos/uGcDWKN91Fs) | Joanna Kosinska | 2026-11-16 | Plain envelopes; no text or brands |
| `blog-security` | [05HLFQu8bFw](https://unsplash.com/photos/05HLFQu8bFw) | Viktor Talashuk | 2026-11-16 | Binder spine labels are internal codes, no brands |
| `not-found` | [_v6mhdOK2g0](https://unsplash.com/photos/_v6mhdOK2g0) | Markus Spiske | 2026-11-16 | Motorway in fog; distant gantry sign unreadable, no vehicles identifiable |
| `contact` | [Nv-87ynmdHA](https://unsplash.com/photos/Nv-87ynmdHA) | Kelly Sikkema | 2026-11-16 | Hands writing a letter; no face, no brands |

Rejected: [C5GeaRZp2D4](https://unsplash.com/photos/C5GeaRZp2D4) (social network names and a company logo on the board) and [IisDPFNUS4k](https://unsplash.com/photos/IisDPFNUS4k) (laptop maker logo in the centre); for the product pages, two laptop photos with third-party websites on screen and a construction photo with a company logo on the hard hats.

### Sensitive-context review (product pages)

The job-search, dental, seniors and security pages use hands, objects and places only. No photo shows a recognisable face, so no real person appears to use, need or endorse a product, as the Unsplash License requires for sensitive uses.
