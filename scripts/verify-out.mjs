// Verifies the static export in out/ (run after NEXT_OUTPUT=export npm run build):
// - the home and 404 HTML pages exist
// - sitemap.xml and robots.txt exist once their routes exist in src/app
// - a favicon exists
// - every file in public/ was copied (except photo sources, which ship as WebP variants)
// - every photo has all of its WebP variants
// - out/api does not exist (there is no server in the static export)

import { access, readdir } from "node:fs/promises";
import path from "node:path";
import config from "../src/lib/image-config.json" with { type: "json" };

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

const icons = ["favicon.ico", "icon.png", "icon.svg", "favicon_io/favicon.ico"];
if (!(await Promise.all(icons.map((i) => exists(path.join(out, i))))).some(Boolean)) {
  problems.push(`no favicon in out/ (looked for ${icons.join(", ")})`);
}

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
