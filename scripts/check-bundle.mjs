// Bundle analysis and budget, run after `next build` (the server build) in CI.
//
// For every statically generated page (.next/server/app/**/*.html) it measures what the page loads up front:
// the JavaScript and CSS chunks referenced by the HTML (gzipped) and the preloaded fonts. It prints the
// heaviest pages and chunks, then fails if:
// 1. any page's initial JavaScript is over JS_BUDGET_KB (gzipped);
// 2. any page's CSS is over CSS_BUDGET_KB (gzipped);
// 3. a page preloads more than one font, or the preloaded font is over FONT_BUDGET_KB;
// 4. three.js, Lenis or the footer aurora shader appears in a page's initial scripts (they must stay lazy chunks);
// 5. the lazy three.js chunk(s) are over THREE_BUDGET_KB (gzipped).

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const JS_BUDGET_KB = 330;
const CSS_BUDGET_KB = 30;
const FONT_BUDGET_KB = 60;
const THREE_BUDGET_KB = 200;

/** Strings that only appear in code that must never be in the initial scripts. */
const LAZY = {
  "three.js": "WebGLRenderer",
  Lenis: "lenis-smooth",
  "the aurora shader": "uColorHigh",
};

const root = path.resolve(import.meta.dirname, "..");
const staticDir = path.join(root, ".next", "static");
const pagesDir = path.join(root, ".next", "server", "app");

async function list(dir, ext) {
  try {
    return (await readdir(dir, { recursive: true })).filter((f) => f.endsWith(ext)).map((f) => f.split(path.sep).join("/"));
  } catch {
    console.error(`check:bundle: ${path.relative(root, dir)} not found. Run \`npm run build\` first.`);
    process.exit(1);
  }
}

const gzCache = new Map();
const textCache = new Map();
async function chunk(relative) {
  if (!gzCache.has(relative)) {
    const source = await readFile(path.join(staticDir, relative)).catch(() => Buffer.alloc(0));
    gzCache.set(relative, gzipSync(source).length);
    textCache.set(relative, source.toString("utf8"));
  }
  return { gz: gzCache.get(relative), text: textCache.get(relative) };
}

const kb = (bytes) => bytes / 1024;
const problems = [];
const rows = [];

for (const page of await list(pagesDir, ".html")) {
  const html = await readFile(path.join(pagesDir, page), "utf8");
  const refs = (ext) => [...new Set([...html.matchAll(new RegExp(`/_next/static/(chunks/[^"?]+\\${ext})`, "g"))].map((m) => m[1]))];
  let js = 0;
  for (const file of refs(".js")) {
    const { gz, text } = await chunk(file);
    js += gz;
    for (const [name, marker] of Object.entries(LAZY)) {
      if (text.includes(marker)) problems.push(`${name} is in an initial script of ${page} (${file}); it must load lazily`);
    }
  }
  let css = 0;
  for (const file of refs(".css")) css += (await chunk(file)).gz;
  const fonts = [...html.matchAll(/<link[^>]+as="font"[^>]*href="\/_next\/static\/(media\/[^"]+)"|<link[^>]+href="\/_next\/static\/(media\/[^"]+)"[^>]*as="font"/g)].map(
    (m) => m[1] ?? m[2],
  );
  let fontBytes = 0;
  for (const font of fonts) fontBytes += (await stat(path.join(staticDir, font)).catch(() => ({ size: 0 }))).size;
  rows.push({ page, js, css, fonts: fonts.length, fontBytes });

  if (kb(js) > JS_BUDGET_KB) problems.push(`${page}: initial JS is ${kb(js).toFixed(1)} KB gzipped, over the ${JS_BUDGET_KB} KB budget`);
  if (kb(css) > CSS_BUDGET_KB) problems.push(`${page}: CSS is ${kb(css).toFixed(1)} KB gzipped, over the ${CSS_BUDGET_KB} KB budget`);
  if (fonts.length > 1) problems.push(`${page}: preloads ${fonts.length} fonts; preload only the Latin subset`);
  if (kb(fontBytes) > FONT_BUDGET_KB) problems.push(`${page}: preloaded font is ${kb(fontBytes).toFixed(1)} KB, over ${FONT_BUDGET_KB} KB`);
}

if (rows.length === 0) problems.push("no prerendered pages found in .next/server/app");

// Every lazy marker must exist in some chunk, or the checks above would pass without testing anything.
// The three.js chunk(s) must also fit their budget.
let threeBytes = 0;
let threeChunks = 0;
const seen = new Set();
for (const file of await list(path.join(staticDir, "chunks"), ".js")) {
  const { gz, text } = await chunk(`chunks/${file}`);
  for (const [name, marker] of Object.entries(LAZY)) if (text.includes(marker)) seen.add(name);
  if (text.includes(LAZY["three.js"])) {
    threeBytes += gz;
    threeChunks++;
  }
}
for (const name of Object.keys(LAZY)) {
  if (!seen.has(name)) problems.push(`no chunk contains ${name} (marker "${LAZY[name]}"); update the marker in check-bundle.mjs`);
}
if (threeChunks === 0) problems.push("no chunk contains three.js; is AstraField still lazy-loading its scene?");
if (kb(threeBytes) > THREE_BUDGET_KB) problems.push(`three.js chunks are ${kb(threeBytes).toFixed(1)} KB gzipped, over ${THREE_BUDGET_KB} KB`);

// Analysis: heaviest pages and the largest chunks they share.
rows.sort((a, b) => b.js - a.js);
console.log(`check:bundle: ${rows.length} pages. Heaviest initial loads (gzipped):`);
for (const r of rows.slice(0, 5)) {
  console.log(`  ${r.page.padEnd(44)} JS ${kb(r.js).toFixed(1).padStart(6)} KB  CSS ${kb(r.css).toFixed(1).padStart(5)} KB  fonts ${r.fonts} (${kb(r.fontBytes).toFixed(0)} KB)`);
}
const largest = [...gzCache.entries()]
  .filter(([f]) => f.endsWith(".js"))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([f, gz]) => `${f.split("/").pop()} ${kb(gz).toFixed(1)} KB`);
console.log(`  Largest chunks: ${largest.join(", ")}`);
console.log(`  three.js: lazy, ${threeChunks} chunk(s), ${kb(threeBytes).toFixed(1)} KB gzipped`);

if (problems.length > 0) {
  console.error("check:bundle failed:");
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `check:bundle: within budget (JS ${JS_BUDGET_KB} KB, CSS ${CSS_BUDGET_KB} KB, one font up to ${FONT_BUDGET_KB} KB, three.js ${THREE_BUDGET_KB} KB; Lenis, the aurora and three.js lazy).`,
);
