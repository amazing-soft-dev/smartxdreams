// Pre-builds responsive WebP variants of every photo in public/images for the static export.
// public/images/home/desk.jpg -> public/_img/home/desk-320.webp, -640, -1024, -1600, -2400.
// Variants are never upscaled; a smaller original is written at its own width under each name.
// Unchanged photos are skipped, so repeated runs are fast.

import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import config from "../src/lib/image-config.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, config.sourceDir);
const outputDir = path.join(root, config.outputDir);

async function listPhotos(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true, recursive: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && config.extensions.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

async function isFresh(source, target) {
  try {
    const [s, t] = await Promise.all([stat(source), stat(target)]);
    return t.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

const photos = await listPhotos(sourceDir);
if (photos.length === 0) {
  console.log(`images: no photos in ${config.sourceDir}; nothing to build.`);
  process.exit(0);
}

let written = 0;
let skipped = 0;
for (const photo of photos) {
  const relative = path.relative(sourceDir, photo);
  const base = relative.slice(0, -path.extname(relative).length);
  for (const width of config.widths) {
    const target = path.join(outputDir, `${base}-${width}.webp`);
    if (await isFresh(photo, target)) {
      skipped += 1;
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await sharp(photo)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toFile(target);
    written += 1;
  }
}

console.log(`images: ${photos.length} photo(s), ${written} variant(s) written, ${skipped} up to date.`);
