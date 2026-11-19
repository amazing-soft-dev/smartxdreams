import { products } from "./products";
import { audiences } from "./site";
import { team } from "./team";
import type { Audience, Product } from "./types";

/** The product with this slug, or undefined. */
export function productBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
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

/** The About page's numbers, each counted from content: people on the team, its disciplines, products. */
export function aboutStats(): { label: string; short: string; value: number }[] {
  return [
    { label: "People on the team", short: "People", value: team.length },
    { label: "Disciplines, from design to AI", short: "Disciplines", value: new Set(team.map((p) => p.group)).size },
    { label: "Products in development", short: "Products", value: products.length },
  ];
}
