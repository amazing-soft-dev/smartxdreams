// Checks the photo rules (see docs/images.md). Passes when there are no photos.
// 1. Every photo file in public/images has exactly one registry entry (src/content/photos.json) with a
//    credit from Unsplash or Pexels, and every entry points to a file that exists.
// 2. Every registered slot is used exactly once in src/, as slot="<id>". A slot marked "pending": true
//    is registered ahead of the page that will use it: it may be unused, but not used (the page issue
//    removes the flag when it starts using the photo).
// 3. Nothing in src/ references /images/... directly (photos go through <Photo slot />).
// 4. Masters stay within the size budget in src/lib/image-config.json (long side, KB per file, total MB).

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import config from "../src/lib/image-config.json" with { type: "json" };
import registry from "../src/content/photos.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, config.sourceDir);
const srcDir = path.join(root, "src");
const registryFile = path.join(root, "src", "content", "photos.json");
const scanExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".mdx", ".json", ".css"]);
const licenses = { unsplash: "Unsplash License", pexels: "Pexels License" };

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

const files = (await walk(sourceDir, (n) => config.extensions.includes(path.extname(n).toLowerCase()))).map(
  toPublicPath,
);
const entries = registry.photos ?? [];
const problems = [];

// 1. Files and registry entries match one to one, with valid credits.
for (const file of files) {
  const matches = entries.filter((e) => e.src === file);
  if (matches.length === 0) problems.push(`no registry entry (and no credit) for ${file}`);
  if (matches.length > 1) problems.push(`${file} is registered ${matches.length} times`);
}
const slots = new Set();
for (const entry of entries) {
  if (!files.includes(entry.src)) problems.push(`slot "${entry.slot}" points to a missing file: ${entry.src}`);
  if (slots.has(entry.slot)) problems.push(`slot "${entry.slot}" is registered more than once`);
  slots.add(entry.slot);
  const c = entry.credit ?? {};
  if (!c.photographer || !c.profileUrl || !c.photoUrl) problems.push(`slot "${entry.slot}" has an incomplete credit`);
  if (licenses[c.source] !== c.license) {
    problems.push(`slot "${entry.slot}" must be from Unsplash or Pexels under its own license (got ${c.source} / ${c.license})`);
  }
}

// 2 and 3. Scan src/ (except the registry) for slot uses and direct /images references.
// Test files mention slots (including deliberately missing ones) without using them on the site.
const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f);
const sources = (await walk(srcDir, (n) => scanExtensions.has(path.extname(n)))).filter((f) => f !== registryFile && !isTest(f));
const uses = new Map(entries.map((e) => [e.slot, []]));
const pending = new Set(entries.filter((e) => e.pending === true).map((e) => e.slot));
const escaped = config.sourcePublicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const direct = new RegExp(`${escaped}/[A-Za-z0-9._/-]+\\.(?:jpe?g|png|webp)`, "gi");
// A use is the Photo prop (slot="id") or a content field that feeds it (slot: "id").
const slotUse = /\bslot(?:=|:\s*)["']([a-z0-9-]+)["']/g;

for (const file of sources) {
  const text = await readFile(file, "utf8");
  const where = path.relative(root, file);
  for (const match of text.matchAll(direct)) problems.push(`direct reference ${match[0]} in ${where}; use <Photo slot />`);
  for (const match of text.matchAll(slotUse)) {
    if (uses.has(match[1])) uses.get(match[1]).push(where);
    else problems.push(`unknown slot "${match[1]}" in ${where}`);
  }
}
for (const [slot, where] of uses) {
  if (pending.has(slot)) {
    if (where.length > 0) problems.push(`slot "${slot}" is used but still marked pending; remove "pending" from photos.json`);
    continue;
  }
  if (where.length === 0) problems.push(`slot "${slot}" is never used`);
  if (where.length > 1) problems.push(`slot "${slot}" is used ${where.length} times (${where.join(", ")})`);
}

// 4. Size budget for masters (src/lib/image-config.json): long side, bytes per file, and total bytes.
const budget = config.budget;
let totalBytes = 0;
let largest = { file: "", bytes: 0 };
if (budget) {
  const sharp = (await import("sharp")).default;
  for (const file of files) {
    const abs = path.join(root, "public", file);
    const { size } = await stat(abs);
    totalBytes += size;
    if (size > largest.bytes) largest = { file, bytes: size };
    const { width = 0, height = 0 } = await sharp(abs).metadata();
    if (Math.max(width, height) > budget.maxLongSidePx) {
      problems.push(`${file} is ${width}x${height}; resize so the long side is at most ${budget.maxLongSidePx} px`);
    }
    if (size > budget.maxMasterKB * 1024) {
      problems.push(`${file} is ${Math.round(size / 1024)} KB; the budget is ${budget.maxMasterKB} KB per photo (re-export at quality ~80)`);
    }
  }
  if (totalBytes > budget.maxTotalMB * 1024 * 1024) {
    problems.push(`photos total ${(totalBytes / 1024 / 1024).toFixed(1)} MB; the budget is ${budget.maxTotalMB} MB`);
  }
}

if (problems.length > 0) {
  console.error(`check:images failed (${files.length} photo file(s), ${entries.length} registry entr(ies)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const sizes = budget
  ? ` Masters ${(totalBytes / 1024 / 1024).toFixed(1)} of ${budget.maxTotalMB} MB; largest ${Math.round(largest.bytes / 1024)} of ${budget.maxMasterKB} KB.`
  : "";
console.log(
  `check:images: ${files.length} photo(s), all credited; ${entries.length - pending.size} used exactly once, ${pending.size} pending their page.${sizes}`,
);
