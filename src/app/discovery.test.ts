import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { retiredProducts } from "@/content/products/retired";
import { GET as llmsTxt } from "./llms.txt/route";
import sitemap from "./sitemap";

const retiredPaths = Object.keys(retiredProducts).map((slug) => `/products/${slug}`);

describe("what search engines and language models are told", () => {
  it("the sitemap lists each renamed product at its new path and never at an old one", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    for (const { successor } of Object.values(retiredProducts)) expect(urls).toContain(`/products/${successor}`);
    for (const old of retiredPaths) expect(urls).not.toContain(old);
  });

  it("llms.txt names the products by their new names and links their new paths", async () => {
    const text = await llmsTxt().text();
    for (const { name, successor } of Object.values(retiredProducts)) {
      expect(text).toContain(`/products/${successor})`);
      expect(text).not.toContain(name);
    }
    for (const old of retiredPaths) expect(text).not.toContain(`${old})`);
  });

  it("no page's source names a renamed product by its old name (meta descriptions included)", () => {
    for (const page of ["page.tsx", "products/page.tsx", "about/page.tsx", "contact/page.tsx"]) {
      const source = readFileSync(path.join(import.meta.dirname, page), "utf8");
      for (const { name } of Object.values(retiredProducts)) expect(source, page).not.toContain(name);
    }
  });
});
