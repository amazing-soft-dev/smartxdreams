// Builds the Earth plate's WebP variants (public/brand/earth/earth-emblem-<width>.webp) and its emblem mask
// (earth-emblem-mask.png) from the master PNG supplied by the SmartxDreams team. Run it when the art changes,
// then run scripts/measure-earth-plate.mjs, update src/components/earth/plate.ts and re-trace EMBLEM_STROKES
// below (see docs/brand.md and docs/earth.md).
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

// The emblem mask: white where the cloud emblem is, black elsewhere, softened at its edge. The scene keeps the
// cyclone's swirl (and, later, the weather) off what it covers, so the emblem keeps its shape while the clouds
// beside it move. The emblem is two cloud strokes, traced here as centre lines in master pixels: the inner
// hook (top stroke, U-turn, then the tail down to the left) and the outer C around it. Stroke widths include
// about 8 px of margin on each side, and the blur softens the edge over about as much again. A quarter of the
// master's size is plenty for a mask this soft.
const EMBLEM_STROKES = [
  {
    width: 48,
    points: [[1150, 440], [1230, 435], [1305, 432], [1360, 440], [1382, 465], [1365, 492], [1305, 502], [1230, 505], [1155, 510], [1095, 525], [1050, 560], [1015, 610]],
  },
  {
    width: 62,
    points: [[1140, 410], [1190, 375], [1280, 360], [1380, 365], [1455, 395], [1500, 440], [1517, 490], [1505, 530], [1462, 560], [1380, 578], [1280, 583], [1180, 590], [1105, 604], [1040, 627]],
  },
];
const MASK_SCALE = 0.25;
const MASK_BLUR = 6;
const scaleTo = (n) => (n * masterWidth) / 1659; // the strokes were traced on the 1659 px master
const strokes = EMBLEM_STROKES.map(
  ({ width, points }) =>
    `<polyline points="${points.map(([x, y]) => `${scaleTo(x)},${scaleTo(y)}`).join(" ")}" stroke-width="${scaleTo(width)}"/>`,
).join("");
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${masterWidth}" height="${masterHeight}"><rect width="100%" height="100%" fill="black"/><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round">${strokes}</g></svg>`;
const maskFile = path.join(outDir, "earth-emblem-mask.png");
const blurred = await sharp(Buffer.from(maskSvg)).blur(MASK_BLUR).png().toBuffer();
const mask = await sharp(blurred)
  .resize({ width: Math.round(masterWidth * MASK_SCALE) })
  .greyscale()
  .png({ compressionLevel: 9 })
  .toFile(maskFile);
console.log(`${path.relative(root, maskFile)}  ${mask.width} x ${mask.height}  ${Math.round(mask.size / 1024)} KB`);

console.log(`master ${masterWidth} x ${masterHeight}`);
if (failed) process.exit(1);
