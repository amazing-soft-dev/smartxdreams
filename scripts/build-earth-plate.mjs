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
// master pixels, the inner hook and the outer C, with about 8 px of margin on each side). A quarter of the
// master's size is plenty for a mask this soft.
// - red: white where the cloud emblem is, black elsewhere, softened at its edge by a blur of about as much again
//   as the margin. The scene keeps the cyclone's turn off what it covers.
// - green: each pixel's distance from the strokes' edge, as emblemDistance() in plate.ts works it out: black on
//   the strokes, white at regionRange plate heights or further. The scene carries the plate near the emblem with
//   it as one piece, fading out with this distance, so the fade follows the emblem's shape.
const { master: traced, regionRange, strokes: EMBLEM_STROKES } = JSON.parse(
  await fs.readFile(path.join(root, "src/components/earth/emblem-strokes.json"), "utf8"),
);
const MASK_SCALE = 0.25;
const MASK_BLUR = 6;
const scaleTo = (n) => (n * masterWidth) / traced.width;
const strokes = EMBLEM_STROKES.map(
  ({ width, points }) =>
    `<polyline points="${points.map(([x, y]) => `${scaleTo(x)},${scaleTo(y)}`).join(" ")}" stroke-width="${scaleTo(width)}"/>`,
).join("");
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${masterWidth}" height="${masterHeight}"><rect width="100%" height="100%" fill="black"/><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round">${strokes}</g></svg>`;
const maskFile = path.join(outDir, "earth-emblem-mask.png");
const blurred = await sharp(Buffer.from(maskSvg)).blur(MASK_BLUR).png().toBuffer();
const { data: red, info: maskInfo } = await sharp(blurred)
  .resize({ width: Math.round(masterWidth * MASK_SCALE) })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

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
const { width: mw, height: mh, channels } = maskInfo;
const rgb = Buffer.alloc(mw * mh * 3);
for (let j = 0; j < mh; j++) {
  for (let i = 0; i < mw; i++) {
    const k = j * mw + i;
    const d = distance(((i + 0.5) / mw) * (traced.width / traced.height), (j + 0.5) / mh);
    rgb[k * 3] = red[k * channels];
    rgb[k * 3 + 1] = Math.round(255 * Math.min(1, d / regionRange));
  }
}
const mask = await sharp(rgb, { raw: { width: mw, height: mh, channels: 3 } })
  .png({ compressionLevel: 9 })
  .toFile(maskFile);
console.log(`${path.relative(root, maskFile)}  ${mask.width} x ${mask.height}  ${Math.round(mask.size / 1024)} KB`);
console.log(`master ${masterWidth} x ${masterHeight}`);
if (failed) process.exit(1);
