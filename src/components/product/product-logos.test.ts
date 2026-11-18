import { existsSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { products } from "@/content/products";
import { PRODUCT_LOGO_SIZES, ProductLogo, productLogoSrc } from "./ProductLogo";

const root = path.resolve(import.meta.dirname, "..", "..", "..");

describe("product logos", () => {
  it.each(products.map((p) => [p.slug] as const))("%s has a master in assets/products", (slug) => {
    expect(existsSync(path.join(root, "assets", "products", `${slug}.png`))).toBe(true);
  });

  it.each(products.flatMap((p) => PRODUCT_LOGO_SIZES.map((size) => [p.slug, size] as const)))(
    "%s has a %i px square logo file",
    async (slug, size) => {
      const file = path.join(root, "public", productLogoSrc(slug, size));
      expect(existsSync(file), `${file} is missing: run npm run brand`).toBe(true);
      const { width, height } = await sharp(file).metadata();
      expect([width, height]).toEqual([size, size]);
    },
  );

  it("every product describes its logo for where it stands alone", () => {
    for (const p of products) expect(p.logo.alt).toMatch(new RegExp(`^${p.name} logo: .{10,}`));
  });

  it("is named by its alt text, or hidden next to the product's name", () => {
    const product = products[0]!;
    const named = renderToStaticMarkup(createElement(ProductLogo, { product }));
    expect(named).toContain(`alt="${product.logo.alt}"`);
    const decorative = renderToStaticMarkup(createElement(ProductLogo, { product, decorative: true }));
    expect(decorative).toMatch(/alt=""[^>]*aria-hidden="true"/);
  });
});
