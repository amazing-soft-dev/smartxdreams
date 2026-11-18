// Builds the Earth plate's WebP variants (public/brand/earth/earth-emblem-<width>.webp) and its emblem mask
// (earth-emblem-mask.png) from the master PNG supplied by the SmartxDreams team. Run it when the art changes,
// then run scripts/measure-earth-plate.mjs, update src/components/earth/plate.ts and re-trace the emblem
// in src/components/earth/emblem-strokes.json (see docs/brand.md and docs/earth.md).
//
//   node scripts/build-earth-plate.mjs [path/to/master.png]
//
// The widest variant is the master's own width, so nothing is ever upscaled. Each variant must stay under
// the 800 KB photo budget; the script fails if one does not.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const master = process.argv[2] ?? path.join(root, "public/brand/Cloud-Formed Emblem Over Earth.png");
const outDir = path.join(root, "public/brand/earth");

/** Width and WebP quality per variant, narrowest first; the last is the master's width. */
const VARIANTS = [
  [768, 78],
  [1200, 80],
  [null, 82],
];
const MAX_BYTES = 800 * 1024;

const { width: masterWidth, height: masterHeight } = await sharp(master).metadata();
await fs.mkdir(outDir, { recursive: true });

let failed = false;
for (const [wanted, quality] of VARIANTS) {
  const width = Math.min(wanted ?? masterWidth, masterWidth);
  const file = path.join(outDir, `earth-emblem-${width}.webp`);
  const info = await sharp(master)
    .removeAlpha()
    .resize({ width })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(file);
  const kb = Math.round(info.size / 1024);
  const over = info.size > MAX_BYTES;
  failed ||= over;
  console.log(`${path.relative(root, file)}  ${info.width} x ${info.height}  q${quality}  ${kb} KB${over ? "  OVER BUDGET" : ""}`);
}

// The emblem mask, from the emblem's two strokes (src/components/earth/emblem-strokes.json: centre lines in
// master pixels, the inner hook and the outer C, with about 8 px of margin on each side): greyscale, each
// pixel's distance from the strokes' edge, as emblemDistance() in plate.ts works it out, black on the strokes
// and white at regionRange plate heights or further. The scene carries the plate near the emblem along with its
// slow drift, fading out with this distance, so the fade follows the emblem's shape. A quarter of the master's
// size is plenty for a field this smooth.
const { master: traced, regionRange, strokes: EMBLEM_STROKES } = JSON.parse(
  await fs.readFile(path.join(root, "src/components/earth/emblem-strokes.json"), "utf8"),
);
const MASK_SCALE = 0.25;
const maskFile = path.join(outDir, "earth-emblem-mask.png");

// Distances in plate heights (traced pixels over the traced height), at each mask pixel's centre.
const segments = EMBLEM_STROKES.flatMap(({ width, points }) =>
  points.slice(1).map((end, i) => ({ a: points[i].map((v) => v / traced.height), b: end.map((v) => v / traced.height), r: width / 2 / traced.height })),
);
const distance = (x, y) => {
  let nearest = Infinity;
  for (const { a, b, r } of segments) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    nearest = Math.min(nearest, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) - r);
  }
  return Math.max(0, nearest);
};
const mw = Math.round(masterWidth * MASK_SCALE);
const mh = Math.round((masterHeight * mw) / masterWidth);
const field = Buffer.alloc(mw * mh);
for (let j = 0; j < mh; j++) {
  for (let i = 0; i < mw; i++) {
    const d = distance(((i + 0.5) / mw) * (traced.width / traced.height), (j + 0.5) / mh);
    field[j * mw + i] = Math.round(255 * Math.min(1, d / regionRange));
  }
}
const mask = await sharp(field, { raw: { width: mw, height: mh, channels: 1 } })
  .toColourspace("b-w")
  .png({ compressionLevel: 9 })
  .toFile(maskFile);
console.log(`${path.relative(root, maskFile)}  ${mask.width} x ${mask.height}  ${Math.round(mask.size / 1024)} KB`);
console.log(`master ${masterWidth} x ${masterHeight}`);
if (failed) process.exit(1);
