/**
 * Test support: which modules a source file pulls in. A client component ("use client") ships everything it
 * imports to the browser, so tests use this to keep server-only content (the photo registry, the full
 * product copy) out of the client modules' import closure.
 *
 * Imports are read with regular expressions, which is enough for this codebase's plain ES imports: static
 * imports and re-exports at the start of a line, and import("...") anywhere. Type-only imports are skipped,
 * as the compiler erases them. A path that cannot be resolved throws, so a miss is never silent.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const srcDir = path.join(root, "src");

const STATIC_IMPORT = /^[ \t]*(?:import|export)\s+(type\s+)?([\w$*{},\s]*?)\s*from\s*["']([^"']+)["']/gm;
const SIDE_EFFECT_IMPORT = /^[ \t]*import\s*["']([^"']+)["']/gm;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?["']([^"']+)["']/g;
const COMMENT_LINE = /^\s*(?:\/\/|\/?\*)/;
const USE_CLIENT =/^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/;

/** Repo-relative with forward slashes (src/content/photos.ts): how files are named in results. */
const toId = (file: string) => path.relative(root, file).split(path.sep).join("/");

const isCode = (id: string) => /\.tsx?$/.test(id);

const sources = new Map<string, string>();
function read(id: string): string {
  let text = sources.get(id);
  if (text === undefined) {
    text = readFileSync(path.join(root, id), "utf8");
    sources.set(id, text);
  }
  return text;
}

/** `{ type A, type B }`: every name is a type, so nothing is imported at run time. */
function onlyTypes(clause: string): boolean {
  const names = /^\{([\s\S]*)\}$/.exec(clause.trim())?.[1];
  if (names === undefined) return false;
  const list = names.split(",").map((n) => n.trim()).filter(Boolean);
  return list.length > 0 && list.every((n) => n.startsWith("type "));
}

/** The module specifiers a file imports for their values. */
function specifiers(id: string): string[] {
  const text = read(id);
  const found: string[] = [];
  for (const [, typeOnly, clause, specifier] of text.matchAll(STATIC_IMPORT)) {
    if (!typeOnly && !onlyTypes(clause ?? "")) found.push(specifier!);
  }
  for (const match of text.matchAll(SIDE_EFFECT_IMPORT)) found.push(match[1]!);
  for (const match of text.matchAll(DYNAMIC_IMPORT)) {
    // An import("...") that a comment mentions is not an import.
    const line = text.slice(text.lastIndexOf("\n", match.index) + 1, match.index);
    if (!COMMENT_LINE.test(line)) found.push(match[1]!);
  }
  return found;
}

/** The source file behind "@/..." or a relative specifier; null for a package. */
function resolve(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(srcDir, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(root, path.dirname(from), specifier)
      : null;
  if (base === null) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  const file = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!file) throw new Error(`Cannot resolve "${specifier}" imported by ${from}`);
  return toId(file);
}

/** "zod/v4" and "zod" are the package zod; "@vercel/analytics/next" is @vercel/analytics. */
const packageName = (specifier: string) => specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/");

export type ImportClosure = {
  /** Every source file reached, the entry included, with the file that first imported it (null for the entry). */
  files: Map<string, string | null>;
  /** Every package imported along the way, with the first file that imported it. */
  packages: Map<string, string>;
};

/**
 * Everything `entry` (repo-relative, such as "src/components/nav/Header.tsx") imports, directly or through
 * other modules. A file for which `stopAt` returns true is recorded but not looked into: pass
 * `isClientModule` to walk only the server side of a page.
 */
export function importClosure(entry: string, stopAt: (id: string) => boolean = () => false): ImportClosure {
  const files = new Map<string, string | null>([[entry, null]]);
  const packages = new Map<string, string>();
  const queue = [entry];
  for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
    if (!isCode(id) || (id !== entry && stopAt(id))) continue;
    for (const specifier of specifiers(id)) {
      const target = resolve(id, specifier);
      if (target === null) {
        if (!packages.has(packageName(specifier))) packages.set(packageName(specifier), id);
      } else if (!files.has(target)) {
        files.set(target, id);
        queue.push(target);
      }
    }
  }
  return { files, packages };
}

/** How the closure reached a file, for failure messages: "a.tsx > b.ts > c.ts". */
export function importChain(closure: ImportClosure, id: string): string {
  const chain = [id];
  for (let from = closure.files.get(id); from; from = closure.files.get(from)) chain.unshift(from);
  return chain.join(" > ");
}

/** True when the file starts with the "use client" directive. */
export function isClientModule(id: string): boolean {
  return isCode(id) && USE_CLIENT.test(read(id));
}

/** Every "use client" file under src. */
export function clientModules(): string[] {
  return readdirSync(srcDir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => toId(path.join(entry.parentPath, entry.name)))
    .filter(isClientModule)
    .sort();
}
