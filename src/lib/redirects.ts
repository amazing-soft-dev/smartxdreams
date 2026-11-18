// Relative, not "@/": next.config.ts loads this file before path aliases exist.
import { retiredProducts } from "../content/products/retired";

/**
 * Permanent (308) redirects for addresses people are likely to type or that older links may use. Applied by
 * the server build (next.config.ts). Anything else that does not exist gets the 404 page, which suggests the
 * closest real page.
 */
export const siteRedirects: { source: string; destination: string; permanent: true }[] = [
  { source: "/home", destination: "/", permanent: true },
  { source: "/index", destination: "/", permanent: true },
  // Pages from the original site template that SmartxDreams covers on the products page.
  { source: "/features", destination: "/products", permanent: true },
  { source: "/pricing", destination: "/products", permanent: true },
  { source: "/integrations", destination: "/products", permanent: true },
  { source: "/waitlist", destination: "/products", permanent: true },
  // Singular and plural slips.
  { source: "/product", destination: "/products", permanent: true },
  { source: "/product/:slug", destination: "/products/:slug", permanent: true },
  { source: "/posts/:slug", destination: "/blog/:slug", permanent: true },
  { source: "/blog/categories/:cat", destination: "/blog/category/:cat", permanent: true },
  // Renamed products (src/content/products/retired.ts): the old page address goes to the new one.
  ...Object.entries(retiredProducts).map(([slug, { successor }]) => ({
    source: `/products/${slug}`,
    destination: `/products/${successor}`,
    permanent: true as const,
  })),
  // Common names for the legal pages.
  { source: "/privacy-policy", destination: "/privacy", permanent: true },
  { source: "/terms-of-service", destination: "/terms", permanent: true },
  { source: "/terms-of-use", destination: "/terms", permanent: true },
];
