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

  it("sits on the tile colour its product names", () => {
    for (const product of products.filter((p) => p.logo.tile !== "none")) {
      const tile = product.logo.tile as { background: string };
      expect(tile.background).toMatch(/^#[0-9A-F]{6}$/);
      const html = renderToStaticMarkup(createElement(ProductLogo, { product, size: 40 }));
      expect(html).toContain(`background-color:${tile.background}`);
      // Inset on the tile: the artwork is 72% of the square.
      expect(html).toMatch(/<img[^>]*width="29"/);
    }
  });

  it("takes a one-off tile colour from tileBackground", () => {
    const product = products.find((p) => p.logo.tile !== "none")!;
    const html = renderToStaticMarkup(createElement(ProductLogo, { product, tileBackground: "#123456" }));
    expect(html).toContain("background-color:#123456");
  });

  it("draws an app-icon logo edge to edge, on no second square", () => {
    const toothledger = products.find((p) => p.slug === "toothledger")!;
    expect(toothledger.logo.tile).toBe("none");
    for (const props of [{}, { tileBackground: "#FFFFFF" }]) {
      const html = renderToStaticMarkup(createElement(ProductLogo, { product: toothledger, size: 40, ...props }));
      expect(html).toContain('data-logo-tile="none"');
      expect(html).not.toContain("background-color");
      expect(html).not.toContain("ring-1");
      expect(html).toMatch(/<img[^>]*width="40"[^>]*height="40"/);
    }
  });

  it("still returns the bare artwork with tile={false}", () => {
    for (const product of products) {
      const html = renderToStaticMarkup(createElement(ProductLogo, { product, size: 20, tile: false }));
      expect(html.startsWith("<img")).toBe(true);
    }
  });
});
