import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import type { Product } from "@/content/types";

type RetiredProductProps = {
  /** The product's old name, as old links and emails still show it. */
  oldName: string;
  /** The product it became. */
  product: Product;
};

/**
 * What an old product address shows in the static export, which has no server to redirect from: an
 * instant meta refresh to the renamed product's page (React hoists the tag into <head>), and, for anyone
 * whose browser does not follow it, a heading and a link. The server build never renders this: next.config
 * redirects the old address before any page is reached (src/lib/redirects.ts).
 */
export function RetiredProduct({ oldName, product }: RetiredProductProps) {
  const href = `/products/${product.slug}`;
  return (
    <main id="main" tabIndex={-1}>
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <Section surface="dark" labelledBy="retired-title" className="min-h-[70svh] pt-36 md:pt-44">
        <div className="max-w-2xl">
          <h1 id="retired-title" className="text-display">
            {oldName} is now {product.name}
          </h1>
          <p className="mt-5 text-body-l text-white/75">
            Same product, new name. {product.name}: {product.tagline}
          </p>
          <Button href={href} variant="coral" className="mt-8">
            {`Go to ${product.name}`}
          </Button>
        </div>
      </Section>
    </main>
  );
}
