import { describe, expect, it } from "vitest";
import { blogCategories } from "./blog/categories";
import { photos } from "./photos";
import { products } from "./products";
import { productSlugs, relatedProducts } from "./selectors";
import { audiences, companyFaq, mainNav } from "./site";
import { readyRoutes } from "@/lib/routes";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("products", () => {
  it("are exactly six, with unique slugs", () => {
    const slugs = products.map((p) => p.slug);
    expect(slugs).toHaveLength(6);
    expect(new Set(slugs).size).toBe(6);
    expect([...slugs].sort()).toEqual(["acorn", "joined", "senioraiplans", "sitelog", "toothledger", "trustdraft"]);
  });

  it("have URL-safe slugs and unique names", () => {
    for (const p of products) expect(p.slug).toMatch(SLUG);
    expect(new Set(products.map((p) => p.name)).size).toBe(products.length);
  });

  it("have the copy every product page needs", () => {
    for (const p of products) {
      expect(p.tagline.length, p.slug).toBeGreaterThan(10);
      expect(p.summary.length, p.slug).toBeGreaterThan(40);
      expect(p.steps.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.features.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.limits.length, `${p.slug} must say what it does not do`).toBeGreaterThanOrEqual(1);
    }
  });

  it("keep search titles and descriptions within what search results show", () => {
    for (const p of products) {
      expect(p.seo.title.length, p.slug).toBeLessThanOrEqual(70);
      expect(p.seo.description.length, p.slug).toBeLessThanOrEqual(160);
    }
  });

  it("carry a not-advice disclaimer where money, health or job applications are involved", () => {
    for (const slug of ["acorn", "toothledger", "senioraiplans"]) {
      expect(products.find((p) => p.slug === slug)?.disclaimer, slug).toBeTruthy();
    }
  });

  it("only relate to other real products", () => {
    for (const p of products) {
      expect(
        p.related.every((slug) => productSlugs().includes(slug)),
        p.slug,
      ).toBe(true);
      expect(p.related, p.slug).not.toContain(p.slug);
      expect(relatedProducts(p)).toHaveLength(p.related.length);
    }
  });

  it("use registered photo slots", () => {
    const slots = new Set(photos.map((photo) => photo.slot));
    for (const p of products) if (p.photo) expect(slots.has(p.photo.slot), p.slug).toBe(true);
  });
});

describe("audiences", () => {
  it("cover every product, and every audience has a product", () => {
    const ids = audiences.map((a) => a.id);
    for (const p of products) expect(ids, p.slug).toContain(p.audience);
    for (const id of ids)
      expect(
        products.some((p) => p.audience === id),
        id,
      ).toBe(true);
  });
});

describe("site structure", () => {
  it("lists each ready route once, including every product page", () => {
    const paths = readyRoutes().map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const slug of productSlugs()) expect(paths).toContain(`/products/${slug}`);
    for (const path of paths) expect(path.startsWith("/")).toBe(true);
  });

  it("links the main navigation only to pages that exist", () => {
    const paths = new Set(readyRoutes().map((r) => r.path));
    for (const item of mainNav) expect(paths.has(item.href), item.href).toBe(true);
  });

  it("has company FAQ answers", () => {
    for (const faq of companyFaq) expect(faq.answer.length).toBeGreaterThan(20);
  });
});

describe("blog categories and photos", () => {
  it("have unique ids and only point at real products", () => {
    expect(new Set(blogCategories.map((c) => c.id)).size).toBe(blogCategories.length);
    for (const c of blogCategories) {
      expect(c.id).toMatch(SLUG);
      for (const slug of c.products) expect(productSlugs(), c.id).toContain(slug);
    }
  });

  it("register each photo slot once, with a credit", () => {
    expect(new Set(photos.map((p) => p.slot)).size).toBe(photos.length);
    for (const p of photos) expect(p.credit.photographer, p.slot).toBeTruthy();
  });
});
