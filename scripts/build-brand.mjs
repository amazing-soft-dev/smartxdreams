// Builds every brand file the site loads from the masters in assets/ (see assets/README.md and docs/brand.md):
//
//   public/brand/logo/smartxdreams-mark-on-<light|dark>-<width>.webp   the mark at 32 … 512 px wide
//   public/brand/logo/smartxdreams-mark-on-<light|dark>-512.png        the same as a PNG, for the social card
//   public/brand/logo/smartxdreams-mark-on-light-square-512.png        square, padded: the organisation logo
//   public/brand/icons/…                                                favicons and home-screen icons (below)
//   src/lib/brand-marks.json                                            each mark's size, for the Logo component
//
//   npm run brand            write the files
//   npm run check:brand      fail if a file is missing or its size or format differs from what the masters give
//
// Each master is cleaned before it is sized: the generator that drew the marks left faint specks around and
// inside the ribbon (60 on the charcoal mark, over 100 on the white one). cleanAlpha() keeps the artwork's
// solid parts and the soft edge around them and clears everything else, then the image is trimmed to what is
// left, so a height in px is the height of the artwork. Nothing is ever upscaled.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");

/** Alpha at or above which a pixel is part of the artwork's solid body. */
const SOLID = 128;
/** A solid part smaller than this share of the largest part is a speck, not artwork. */
const MIN_PART = 0.005;
/** Soft (anti-aliased) edge kept around the solid parts, in master pixels. */
const EDGE = 3;
/** No logo file may be larger than this. */
const MAX_BYTES = 80 * 1024;

export const LOGO_WIDTHS = [32, 64, 128, 256, 512];
/** Palette PNG: 256 colours with alpha keeps the ribbon's shading at a fraction of the size. */
const PNG = { palette: true, quality: 95, effort: 10, compressionLevel: 9 };

/**
 * Clears every pixel that is not artwork: labels the 4-connected parts at alpha >= SOLID, keeps the parts at
 * least MIN_PART the size of the largest, and keeps the original alpha only within EDGE px of them.
 * Works in place on raw RGBA and returns the bounding box of what is left.
 */
export function cleanAlpha(data, width, height) {
  const n = width * height;
  const label = new Int32Array(n).fill(-1);
  const sizes = [];
  const stack = [];
  for (let p = 0; p < n; p++) {
    if (label[p] !== -1 || data[p * 4 + 3] < SOLID) continue;
    const id = sizes.length;
    let size = 0;
    label[p] = id;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop();
      size++;
      const x = q % width;
      const y = (q - x) / width;
      for (const r of [x > 0 ? q - 1 : -1, x < width - 1 ? q + 1 : -1, y > 0 ? q - width : -1, y < height - 1 ? q + width : -1]) {
        if (r >= 0 && label[r] === -1 && data[r * 4 + 3] >= SOLID) {
          label[r] = id;
          stack.push(r);
        }
      }
    }
    sizes.push(size);
  }
  const largest = Math.max(0, ...sizes);
  const keep = sizes.map((s) => s >= largest * MIN_PART);

  // Chessboard distance to the nearest kept solid pixel, by two passes; only distances up to EDGE matter.
  const far = EDGE + 1;
  const dist = new Uint8Array(n).fill(far);
  for (let p = 0; p < n; p++) if (label[p] !== -1 && keep[label[p]]) dist[p] = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      let d = dist[p];
      if (x > 0) d = Math.min(d, dist[p - 1] + 1);
      if (y > 0) {
        d = Math.min(d, dist[p - width] + 1);
        if (x > 0) d = Math.min(d, dist[p - width - 1] + 1);
        if (x < width - 1) d = Math.min(d, dist[p - width + 1] + 1);
      }
      dist[p] = Math.min(d, far);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const p = y * width + x;
      let d = dist[p];
      if (x < width - 1) d = Math.min(d, dist[p + 1] + 1);
      if (y < height - 1) {
        d = Math.min(d, dist[p + width] + 1);
        if (x < width - 1) d = Math.min(d, dist[p + width + 1] + 1);
        if (x > 0) d = Math.min(d, dist[p + width - 1] + 1);
      }
      dist[p] = Math.min(d, far);
    }
  }

  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let p = 0; p < n; p++) {
    if (dist[p] > EDGE) {
      data[p * 4 + 3] = 0;
      continue;
    }
    if (data[p * 4 + 3] === 0) continue;
    const x = p % width;
    const y = (p - x) / width;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  // Fully transparent pixels carry no colour worth keeping; zero them so the encoders compress them away.
  for (let p = 0; p < n; p++) if (data[p * 4 + 3] === 0) data.fill(0, p * 4, p * 4 + 3);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** Reads a master, cleans it and returns a sharp instance of the trimmed artwork plus its size. */
export async function loadArtwork(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = cleanAlpha(data, info.width, info.height);
  if (box.width <= 0) throw new Error(`${file}: no artwork left after cleaning`);
  const trimmed = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(box)
    .png()
    .toBuffer();
  return { image: () => sharp(trimmed), width: box.width, height: box.height };
}

const outputs = [];
/** Queues a file: written in build mode, compared in check mode. */
function emit(file, buffer) {
  outputs.push({ file: path.join(root, file), buffer });
}

const MARKS = [
  { name: "smartxdreams-mark-on-light", master: "assets/brand/smartxdreams-mark-on-light.png" },
  { name: "smartxdreams-mark-on-dark", master: "assets/brand/smartxdreams-mark-on-dark.png" },
];

const art = {};
for (const { name, master } of MARKS) {
  art[name] = await loadArtwork(path.join(root, master));
  console.log(`${master}  artwork ${art[name].width} x ${art[name].height}`);
}

// What the Logo component needs to size the mark without loading it: each tone's trimmed artwork size
// (its aspect ratio) and the widths written below.
emit(
  "src/lib/brand-marks.json",
  Buffer.from(
    JSON.stringify(
      {
        widths: LOGO_WIDTHS,
        marks: Object.fromEntries(MARKS.map(({ name }) => [name, { width: art[name].width, height: art[name].height }])),
      },
      null,
      2,
    ) + "\n",
  ),
);

/** The artwork centred on a size x size square, filling `fill` of it, over `background` (transparent by default). */
async function square(artwork, size, fill, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const inner = Math.round(size * fill);
  const mark = await artwork.image().resize({ width: inner, height: inner, fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: mark, gravity: "centre" }]);
}

for (const { name } of MARKS) {
  const a = art[name];
  for (const width of LOGO_WIDTHS) {
    const w = Math.min(width, a.width);
    emit(
      `public/brand/logo/${name}-${width}.webp`,
      await a.image().resize({ width: w }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer(),
    );
  }
  // PNG for consumers that cannot read WebP (the social card renderer): quantised, the shading survives.
  emit(`public/brand/logo/${name}-512.png`, await a.image().resize({ width: Math.min(512, a.width) }).png(PNG).toBuffer());
}

// Search engines want a square organisation logo, legible on white: the charcoal mark centred on a 512 px
// transparent square with a little air around it.
emit(
  "public/brand/logo/smartxdreams-mark-on-light-square-512.png",
  await (await square(art["smartxdreams-mark-on-light"], 512, 0.84)).png(PNG).toBuffer(),
);

// ── Icons ──────────────────────────────────────────────────────────────────────────────────────────────
// public/brand/icons/: what browsers and home screens ask for. The file names are the ones favicon
// generators use, so anyone looking for "apple-touch-icon.png" finds it.
//
// - favicon-16x16, favicon-32x32 and favicon.ico: the charcoal mark on transparency, nearly edge to edge so
//   it still reads at 16 px. Tabs that can follow the colour scheme get src/app/icon.svg instead.
// - android-chrome-192x192 and -512x512: the charcoal mark on transparency, for the manifest's light splash.
// - apple-touch-icon (180): iOS fills transparency with black, which would swallow the charcoal mark, so it
//   is the white mark on an opaque ink square with 18% air on each side.
// - maskable-512x512: Android crops maskable icons to any shape inside a central circle 80% of the icon
//   wide, so the background is opaque ink and the white mark stays inside that circle.
const INK = { r: 0x0f, g: 0x12, b: 0x26, alpha: 1 };
const onLight = art["smartxdreams-mark-on-light"];
const onDark = art["smartxdreams-mark-on-dark"];
const icon = (file, image) => emit(`public/brand/icons/${file}`, image);

const faviconPngs = {};
for (const size of [16, 32, 48]) faviconPngs[size] = await (await square(onLight, size, 0.96)).png().toBuffer();
icon("favicon-16x16.png", faviconPngs[16]);
icon("favicon-32x32.png", faviconPngs[32]);
icon("favicon.ico", ico([16, 32, 48].map((size) => ({ size, png: faviconPngs[size] }))));
for (const size of [192, 512]) icon(`android-chrome-${size}x${size}.png`, await (await square(onLight, size, 0.86)).png(PNG).toBuffer());
const appleIcon = await (await square(onDark, 180, 0.64, INK)).removeAlpha().png().toBuffer();
icon("apple-touch-icon.png", appleIcon);
// A square inside the 80% circle is at most 0.8 / sqrt(2) = 0.566 of the icon; the mark is not a square, so
// 0.56 of the icon on its longer side keeps every corner of it inside.
icon("maskable-512x512.png", await (await square(onDark, 512, 0.56, INK)).removeAlpha().png(PNG).toBuffer());

// ── App icons (Next.js file conventions in src/app) ─────────────────────────────────────────────────
// - favicon.ico and apple-icon.png: the same files as in public/brand/icons/.
emit("src/app/favicon.ico", ico([16, 32, 48].map((size) => ({ size, png: faviconPngs[size] }))));
emit("src/app/apple-icon.png", appleIcon);

/** An ICO file holding PNG images (every browser since IE Vista-era reads PNG entries). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

let failed = false;
for (const { file, buffer } of outputs) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const over = buffer.length > MAX_BYTES;
  failed ||= over;
  if (check) {
    // Compare sizes, not bytes: sharp's encoders may differ by a few bytes between platforms. An ICO is
    // compared by its directory (image count and sizes), which sharp cannot read.
    const current = await fs.readFile(file).catch(() => null);
    if (rel.endsWith(".json")) {
      if (current?.toString().replace(/\r\n/g, "\n") !== buffer.toString()) {
        console.error(`${rel}  missing or out of date: run npm run brand`);
        failed = true;
      }
      continue;
    }
    const meta = (b) => (rel.endsWith(".ico") ? { width: b.readUInt16LE(4), height: b[6], format: "ico" } : sharp(b).metadata());
    const [want, have] = await Promise.all([meta(buffer), current && meta(current)]);
    if (!have || have.width !== want.width || have.height !== want.height || have.format !== want.format) {
      console.error(`${rel}  missing or out of date: run npm run brand`);
      failed = true;
    }
    continue;
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
  console.log(`${rel}  ${Math.round(buffer.length / 1024)} KB${over ? "  OVER BUDGET" : ""}`);
}
if (failed) process.exit(1);
