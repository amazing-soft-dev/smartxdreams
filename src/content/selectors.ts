import { products } from "./products";
import { audiences } from "./site";
import type { Audience, Product } from "./types";

/** The product with this slug, or undefined. */
export function productBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Products for one audience, in display order. */
export function productsByAudience(audience: Audience): Product[] {
  return products.filter((p) => p.audience === audience);
}

/** The display label for an audience id. */
export function audienceLabel(audience: Audience): string {
  return audiences.find((a) => a.id === audience)?.label ?? audience;
}

/** Products listed in a product's `related` field, skipping unknown slugs. */
export function relatedProducts(product: Product): Product[] {
  return product.related.map(productBySlug).filter((p): p is Product => p !== undefined);
}

/** Every product slug, for generateStaticParams. */
export function productSlugs(): string[] {
  return products.map((p) => p.slug);
}
