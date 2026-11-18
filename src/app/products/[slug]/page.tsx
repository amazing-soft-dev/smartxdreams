import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { productMockups } from "@/components/product/mockups";
import {
  ProductFaq,
  ProductFeatures,
  ProductHero,
  ProductLimits,
  ProductProblem,
  ProductPromise,
  ProductRelated,
  ProductSteps,
  ProductWaitlist,
} from "@/components/product/ProductSections";
import { RetiredProduct } from "@/components/product/RetiredProduct";
import { retiredProducts } from "@/content/products/retired";
import { productBySlug, productSlugs } from "@/content/selectors";
import { company } from "@/content/site";
import type { Product } from "@/content/types";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

type ProductPageProps = { params: Promise<{ slug: string }> };

/**
 * Every product page is generated at build time, and so is a forwarding page for each renamed product's old
 * slug (for the static export, which cannot redirect). Any other slug is a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [...productSlugs(), ...Object.keys(retiredProducts)].map((slug) => ({ slug }));
}

/** The renamed product behind an old slug, with its old name. */
function retired(slug: string): { oldName: string; product: Product } | undefined {
  const entry = retiredProducts[slug];
  const product = entry && productBySlug(entry.successor);
  return entry && product ? { oldName: entry.name, product } : undefined;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const old = retired(slug);
  if (old) {
    // Never indexed; the canonical link tells search engines where the page lives now.
    return {
      title: `${old.oldName} is now ${old.product.name}`,
      robots: { index: false, follow: true },
      alternates: { canonical: absoluteUrl(`/products/${old.product.slug}`) },
    };
  }
  const product = productBySlug(slug);
  if (!product) return {};
  return pageMetadata({ title: product.seo.title, description: product.seo.description, path: `/products/${product.slug}` });
}

/** schema.org category per audience. */
const categories: Record<Product["audience"], string> = {
  "job-seekers": "BusinessApplication",
  builders: "BusinessApplication",
  patients: "HealthApplication",
  seniors: "LifestyleApplication",
  "software-teams": "SecurityApplication",
};

/** SoftwareApplication JSON-LD. No offers or ratings: the products are not on sale yet and have no reviews. */
function productJsonLd(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.summary,
    applicationCategory: categories[product.audience],
    operatingSystem: "Web",
    url: absoluteUrl(`/products/${product.slug}`),
    publisher: { "@type": "Organization", name: company.name, url: absoluteUrl("/") },
  };
}

/** One template for all six products; copy comes from src/content/products/<slug>.ts. */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const old = retired(slug);
  if (old) return <RetiredProduct oldName={old.oldName} product={old.product} />;
  const product = productBySlug(slug);
  if (!product) notFound();
  return (
    // readability "large" switches the page to bigger, full-contrast text (see globals.css).
    <main id="main" tabIndex={-1} data-readable={product.readability ?? "standard"}>
      <JsonLd data={productJsonLd(product)} />
      <ProductHero product={product} Mockup={productMockups[product.slug]} />
      <ProductProblem product={product} />
      <ProductSteps product={product} />
      <ProductPromise product={product} />
      <ProductFeatures product={product} />
      <ProductLimits product={product} />
      <ProductFaq product={product} />
      <ProductWaitlist product={product} />
      <ProductRelated product={product} />
    </main>
  );
}
