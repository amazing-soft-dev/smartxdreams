import { mainNav } from "@/content/site";
import type { NavProduct } from "@/content/types";

/**
 * What a product page's label needs of a product. The list comes from the root layout: this module runs in
 * the browser on every page, so it must not import the products and their full copy.
 */
export type LabelProduct = Pick<NavProduct, "slug" | "name">;

/** The word shown in the transition overlay for a destination path. */
export function routeLabel(pathname: string, products: readonly LabelProduct[]): string {
  const product = products.find((p) => pathname === `/products/${p.slug}`);
  if (product) return product.name;
  if (pathname.startsWith("/blog/")) return "Blog";
  const page = mainNav.find((item) => item.href === pathname);
  if (page) return page.label;
  if (pathname === "/privacy") return "Privacy";
  if (pathname === "/terms") return "Terms";
  return "SmartxDreams";
}
