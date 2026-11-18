// Verifies the static export in out/ (run after NEXT_OUTPUT=export npm run build):
// - the home and 404 HTML pages exist
// - sitemap.xml and robots.txt exist once their routes exist in src/app
// - the favicon, SVG icon, Apple touch icon and manifest exist, and so does every icon the manifest lists
// - every logo and icon file scripts/build-brand.mjs writes is there
// - every file in public/ was copied (except photo sources, which ship as WebP variants)
// - every photo has all of its WebP variants
// - out/api does not exist (there is no server in the static export)

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import brandMarks from "../src/lib/brand-marks.json" with { type: "json" };
import config from "../src/lib/image-config.json" with { type: "json" };

/** Browser and home-screen icons built into public/brand/icons/ (see scripts/build-brand.mjs). */
const BRAND_ICONS = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "maskable-512x512.png",
];

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "out");
const problems = [];

const exists = async (p) => access(p).then(() => true, () => false);
async function files(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true });
    return entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
async function expect(relative, why) {
  if (!(await exists(path.join(out, relative)))) problems.push(`missing out/${relative} (${why})`);
}

if (!(await exists(out))) {
  console.error("verify:out failed: out/ does not exist. Run NEXT_OUTPUT=export npm run build first.");
  process.exit(1);
}

await expect("index.html", "home page");
await expect("404.html", "not-found page");

const appRoute = async (name) =>
  (await Promise.all([".ts", ".tsx", ".js"].map((ext) => exists(path.join(root, "src", "app", name + ext))))).some(Boolean);
if (await appRoute("sitemap")) await expect("sitemap.xml", "src/app/sitemap exists");
if (await appRoute("robots")) await expect("robots.txt", "src/app/robots exists");

// App icons from src/app, and every icon the manifest lists.
await expect("favicon.ico", "favicon, src/app/favicon.ico");
await expect("icon.svg", "SVG favicon, src/app/icon.svg");
await expect("apple-icon.png", "Apple touch icon, src/app/apple-icon.png");
await expect("manifest.webmanifest", "web app manifest, src/app/manifest.ts");
if (await exists(path.join(out, "manifest.webmanifest"))) {
  const manifest = JSON.parse(await readFile(path.join(out, "manifest.webmanifest"), "utf8"));
  for (const icon of manifest.icons ?? []) await expect(icon.src.replace(/^\//, ""), "icon listed in the manifest");
}

// The logo files scripts/build-brand.mjs writes: every width the Logo component lists in its srcset, the
// PNGs the social card and the structured data read, and the browser and home-screen icons.
for (const name of Object.keys(brandMarks.marks)) {
  for (const width of brandMarks.widths) await expect(`brand/logo/${name}-${width}.webp`, "logo file in the Logo srcset");
  await expect(`brand/logo/${name}-512.png`, "logo PNG for the social card");
}
await expect("brand/logo/smartxdreams-mark-on-light-square-512.png", "organisation logo in the structured data");
for (const icon of BRAND_ICONS) await expect(`brand/icons/${icon}`, "built browser or home-screen icon");

const publicDir = path.join(root, "public");
const photoSource = path.join(root, config.sourceDir);
const generated = path.join(root, config.outputDir);
for (const file of await files(publicDir)) {
  if (file.startsWith(photoSource + path.sep) || file.startsWith(generated + path.sep)) continue;
  const relative = path.relative(publicDir, file);
  if (!(await exists(path.join(out, relative)))) problems.push(`public asset not copied: ${relative}`);
}

const photos = (await files(photoSource)).filter((f) => config.extensions.includes(path.extname(f).toLowerCase()));
for (const photo of photos) {
  const relative = path.relative(photoSource, photo);
  const base = relative.slice(0, -path.extname(relative).length);
  for (const width of config.widths) {
    await expect(path.join(config.outputPublicPath.replace(/^\//, ""), `${base}-${width}.webp`), `variant of ${relative}`);
  }
}

if (await exists(path.join(out, "api"))) problems.push("out/api exists, but the static export must not contain API routes");

if (problems.length > 0) {
  console.error("verify:out failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`verify:out: ok (${photos.length} photo(s) with ${config.widths.length} variants each).`);
