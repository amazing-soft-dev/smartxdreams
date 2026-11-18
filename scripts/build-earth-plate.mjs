// Builds the Earth plate's WebP variants (public/brand/earth/earth-emblem-<width>.webp) from the master PNG
// supplied by the SmartxDreams team. Run it when the art changes, then run scripts/measure-earth-plate.mjs
// and update src/components/earth/plate.ts (see docs/brand.md and docs/earth.md).
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
console.log(`master ${masterWidth} x ${masterHeight}`);
if (failed) process.exit(1);
