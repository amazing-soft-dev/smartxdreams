// Prints the registry fields that are computed from a photo file, ready to paste into
// src/content/photos.json: width, height, average tint and a tiny blur preview.
// Usage: node scripts/photo-meta.mjs public/images/home/step-1.jpg

import sharp from "sharp";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/photo-meta.mjs <path to photo>");
  process.exit(1);
}

const image = sharp(file).rotate();
const { width, height } = await image.metadata();
const { dominant } = await image.stats();
const hex = (n) => n.toString(16).padStart(2, "0");
const tint = `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`;
const blur = await sharp(file).rotate().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();

console.log(
  JSON.stringify({ width, height, tint, blurDataURL: `data:image/webp;base64,${blur.toString("base64")}` }, null, 2),
);
