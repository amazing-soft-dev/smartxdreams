import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * Every statically generated page of the server build, read from .next/server/app at test-collection time,
 * so a new page is covered without touching the tests. Next.js internals (_not-found, _global-error) are
 * skipped; the 404 page has its own test.
 */
function prerenderedRoutes(): string[] {
  const dir = path.join(process.cwd(), ".next", "server", "app");
  let files: string[];
  try {
    files = readdirSync(dir, { recursive: true, encoding: "utf8" });
  } catch {
    throw new Error("No build found in .next/server/app. Run `npm run build` before the end-to-end tests.");
  }
  return files
    .map((f) => f.split(path.sep).join("/"))
    .filter((f) => f.endsWith(".html") && !f.split("/").some((part) => part.startsWith("_")))
    .map((f) => (f === "index.html" ? "/" : `/${f.replace(/\.html$/, "")}`))
    .sort();
}

export const pageRoutes = prerenderedRoutes();
