import { ProductLogo } from "@/components/product/ProductLogo";
import { TransitionLink } from "@/components/transition/TransitionLink";
import type { Product } from "@/content/types";

/**
 * A compact product card for blog pages: logo, name (the card's single, stretched link), tagline and waitlist
 * status. `headingLevel` keeps the outline right wherever it is used.
 */
export function ProductMiniCard({ product, headingLevel: Heading = "h3" }: { product: Product; headingLevel?: "h3" | "h4" }) {
  return (
    <article
      data-product={product.slug}
      className="relative flex h-full flex-col rounded-[30px] bg-white p-6 outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-violet-500"
    >
      <ProductLogo product={product} size={44} decorative className="mb-4" />
      <Heading className="text-h5">
        <TransitionLink href={`/products/${product.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-[30px]">
          {product.name}
        </TransitionLink>
      </Heading>
      <p className="mt-2 text-body text-ink/70">{product.tagline}</p>
      <p className="mt-auto pt-5 text-label font-medium text-violet-600">
        {product.status === "waitlist" ? "Waitlist open" : product.status === "beta" ? "Beta" : "Available"}
      </p>
    </article>
  );
}
