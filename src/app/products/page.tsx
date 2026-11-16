import { Suspense } from "react";
import { ProductsBrowser, ProductsListFallback } from "@/components/products/ProductsBrowser";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";

/** /products: all six products, filterable by who they are for. */
export default function ProductsPage() {
  return (
    <main>
      <section
        aria-labelledby="products-title"
        data-surface="dark"
        data-nav-theme="dark"
        className="relative isolate overflow-hidden bg-ink pt-36 pb-20 text-white md:pt-44"
      >
        <Glow color="violet" size={900} opacity={0.4} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">Products</Tag>
          <h1 id="products-title" className="mt-6 text-display">
            Six products, <span className="text-violet-300">one job each.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">
            Find the one made for you. Every product is in development with an open waitlist.
          </p>
        </Container>
      </section>
      <Section labelledBy="products-title" surface="canvas">
        {/* The browser reads search params, so it renders inside Suspense; the fallback lists every product. */}
        <Suspense fallback={<ProductsListFallback />}>
          <ProductsBrowser />
        </Suspense>
      </Section>
    </main>
  );
}
