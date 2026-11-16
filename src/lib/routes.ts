import { productSlugs } from "@/content/selectors";

/**
 * Public routes for the sitemap and llms.txt. A route is listed only once its page exists:
 * each page issue flips `ready` to true when it lands, so the sitemap never links to a 404.
 */
export type SiteRoute = {
  path: string;
  ready: boolean;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

const pages: SiteRoute[] = [
  { path: "/", ready: true, changeFrequency: "weekly", priority: 1 },
  { path: "/products", ready: true, changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", ready: false, changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", ready: false, changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", ready: false, changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", ready: false, changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", ready: false, changeFrequency: "yearly", priority: 0.2 },
];

/** Product pages exist since the product template landed (issue #34). */
export const productPagesReady = true;

const productRoutes = (): SiteRoute[] =>
  productSlugs().map((slug) => ({
    path: `/products/${slug}`,
    ready: productPagesReady,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

/** Every route whose page exists. */
export function readyRoutes(): SiteRoute[] {
  return [...pages, ...productRoutes()].filter((r) => r.ready);
}
