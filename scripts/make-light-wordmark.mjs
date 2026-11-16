// Builds public/brand/logo-full-light.png, the version of the full logo for dark surfaces:
// every ink-coloured part (the wordmark and the rounded square of the mark) becomes white, the violet
// and coral stay as they are, and the soft black drop shadow (invisible on dark backgrounds) is removed.
// Run once when logo-full.png changes: node scripts/make-light-wordmark.mjs

import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const input = path.join(root, "public/brand/logo-full.png");
const output = path.join(root, "public/brand/logo-full-light.png");

// Process the whole image: ink appears in the mark (square) and in the wordmark.
const START_X = 0;

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

for (let y = 0; y < height; y += 1) {
  for (let x = START_X; x < width; x += 1) {
    const i = (y * width + x) * 4;
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a === 0) continue;
    const isShadow = r + g + b < 25; // pure black, semi-transparent
    const isViolet = b - r > 80 && b > 150; // the circle and the "x"
    if (isShadow) {
      data[i + 3] = 0;
    } else if (!isViolet && r < 120 && g < 120 && b < 140) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
}

await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output);
console.log(`wrote ${path.relative(root, output)}`);
