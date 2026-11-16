import { products } from "@/content/products";
import { mainNav } from "@/content/site";

/** The word shown in the transition overlay for a destination path. */
export function routeLabel(pathname: string): string {
  const product = products.find((p) => pathname === `/products/${p.slug}`);
  if (product) return product.name;
  if (pathname.startsWith("/blog/")) return "Blog";
  const page = mainNav.find((item) => item.href === pathname);
  if (page) return page.label;
  if (pathname === "/privacy") return "Privacy";
  if (pathname === "/terms") return "Terms";
  return "SmartxDreams";
}
