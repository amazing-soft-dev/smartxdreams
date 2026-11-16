// Checks the three.js budget after `next build` (server build):
// 1. No script that the Home page loads up front contains three.js (it must stay a lazy chunk).
// 2. The lazy chunk(s) containing three.js are at most 200 KB gzipped in total.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 200;
const root = path.resolve(import.meta.dirname, "..");
const chunksDir = path.join(root, ".next", "static", "chunks");
const homeHtml = path.join(root, ".next", "server", "app", "index.html");
// A string that only appears in three.js's renderer code.
const MARKER = "WebGLRenderer";

let files;
try {
  files = (await readdir(chunksDir, { recursive: true })).filter((f) => f.endsWith(".js"));
} catch {
  console.error("check:bundle: .next/static/chunks not found. Run `npm run build` first.");
  process.exit(1);
}

const threeChunks = [];
for (const file of files) {
  const source = await readFile(path.join(chunksDir, file));
  if (source.includes(MARKER)) threeChunks.push({ file, gz: gzipSync(source).length });
}

const problems = [];
if (threeChunks.length === 0) problems.push("no chunk contains three.js; is AstraField still lazy-loading its scene?");

const html = await readFile(homeHtml, "utf8").catch(() => "");
const initialScripts = [...html.matchAll(/<script[^>]+src="[^"]*\/_next\/static\/chunks\/([^"?]+)/g)].map((m) => m[1]);
for (const chunk of threeChunks) {
  if (initialScripts.some((s) => chunk.file.replaceAll("\\", "/").endsWith(s))) {
    problems.push(`three.js is in an initial Home script (${chunk.file}); it must be loaded lazily`);
  }
}

const totalKb = threeChunks.reduce((sum, c) => sum + c.gz, 0) / 1024;
if (totalKb > BUDGET_KB) problems.push(`three.js chunks are ${totalKb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget`);

if (problems.length > 0) {
  console.error("check:bundle failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `check:bundle: three.js is lazy (${threeChunks.length} chunk(s), ${totalKb.toFixed(1)} KB gzipped, budget ${BUDGET_KB} KB); not in the initial Home scripts (${initialScripts.length} checked).`,
);
