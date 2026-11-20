import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductsBrowser, ProductsListFallback } from "@/components/products/ProductsBrowser";
import { WhichIsRight } from "@/components/products/WhichIsRight";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { products } from "@/content/products";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SplitText } from "@/components/motion/SplitText";

export const metadata: Metadata = pageMetadata({
  title: "Products",
  description:
    "Six focused AI products from SmartxDreams: Joined, Acorn, SiteLog, ToothLedger, SeniorAIPlans and TrustDraft. Find the one made for you and join its waitlist.",
  path: "/products",
});

/** schema.org ItemList of the six product pages, in display order. */
const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SmartxDreams products",
  itemListElement: products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.name,
    url: absoluteUrl(`/products/${p.slug}`),
  })),
};

/** /products: all six products, filterable by who they are for. */
export default function ProductsPage() {
  return (
    <main id="main" tabIndex={-1}>
      <JsonLd data={itemList} />
      <section
        aria-labelledby="products-title"
        data-surface="dark"
        data-nav-theme="dark"
        // Phones: 112 px above the tag (40 px under the header bar, as on Home) and 48 px below the copy, so
        // the list starts on the first screen. From 810 px the hero is as roomy as before.
        className="relative isolate overflow-hidden bg-ink pt-28 pb-12 text-white md:pt-44 md:pb-20"
      >
        <Glow color="violet" size={900} opacity={0.4} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">Products</Tag>
          <h1 id="products-title" className="mt-6 text-display">
            <SplitText text="Six products, *one job each.*" tone="dark" aboveFold />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">
            Find the one made for you. Every product is in development with an open waitlist.
          </p>
        </Container>
      </section>
      {/* 40 px above the chips on phones in place of the section's 72 px: with the shorter hero, the first
          card starts 96 px higher (519 px in place of 615 px at 390 px wide). */}
      <Section labelledBy="products-title" surface="canvas" className="max-md:pt-10">
        {/* The browser reads search params, so it renders inside Suspense; the fallback lists every product. */}
        <Suspense fallback={<ProductsListFallback />}>
          <ProductsBrowser />
        </Suspense>
      </Section>
      <WhichIsRight />
    </main>
  );
}
