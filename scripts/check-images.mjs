// Checks that every photo in public/images is used exactly once in the source, and that the source
// does not reference a photo that does not exist. A photo is "used" when its public path
// (/images/<path>) appears in a file under src/. Passes when there are no photos.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import config from "../src/lib/image-config.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, config.sourceDir);
const srcDir = path.join(root, "src");
const scanExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".mdx", ".json", ".css"]);
const configFile = path.join(root, "src", "lib", "image-config.json");

async function walk(dir, keep) {
  try {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true });
    return entries.filter((e) => e.isFile() && keep(e.name)).map((e) => path.join(e.parentPath, e.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const toPublicPath = (file) =>
  `${config.sourcePublicPath}/${path.relative(sourceDir, file).split(path.sep).join("/")}`;

const photos = (await walk(sourceDir, (n) => config.extensions.includes(path.extname(n).toLowerCase()))).map(
  toPublicPath,
);
const sources = (await walk(srcDir, (n) => scanExtensions.has(path.extname(n)))).filter((f) => f !== configFile);

const uses = new Map(photos.map((p) => [p, []]));
const missing = [];
const escaped = config.sourcePublicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const reference = new RegExp(`${escaped}/[A-Za-z0-9._/-]+\\.(?:jpe?g|png|webp)`, "gi");

for (const file of sources) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(reference)) {
    const where = path.relative(root, file);
    if (uses.has(match[0])) uses.get(match[0]).push(where);
    else missing.push(`${match[0]} (in ${where})`);
  }
}

const problems = [];
for (const [photo, files] of uses) {
  if (files.length === 0) problems.push(`unused: ${photo}`);
  if (files.length > 1) problems.push(`used ${files.length} times: ${photo} (${files.join(", ")})`);
}
for (const m of missing) problems.push(`missing file: ${m}`);

if (problems.length > 0) {
  console.error(`check:images failed (${photos.length} photo(s)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check:images: ${photos.length} photo(s), each used exactly once.`);
