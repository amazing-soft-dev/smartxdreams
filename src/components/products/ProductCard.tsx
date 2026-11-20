import { ProductLogo } from "@/components/product/ProductLogo";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { audienceLabel } from "@/content/selectors";
import type { Product } from "@/content/types";

/**
 * A product as a card: logo, audience and status pills, name (the link), tagline and summary. One link per card.
 * `headingLevel` keeps the outline right: h2 straight under a page title, h3 under a section's own h2.
 */
export function ProductCard({ product, headingLevel: Heading = "h2" }: { product: Product; headingLevel?: "h2" | "h3" }) {
  return (
    <article
      data-product={product.slug}
      className="group relative flex h-full flex-col rounded-card bg-white p-7 outline-offset-4 transition-[translate,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 hover:shadow-card-hover has-[a:focus-visible]:-translate-y-1.5 has-[a:focus-visible]:shadow-card-hover motion-reduce:has-[a:focus-visible]:translate-y-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-violet-500"
    >
      <div className="flex items-start justify-between gap-4">
        <ProductLogo product={product} size={52} decorative />
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full bg-ink/[0.07] px-3 py-1 text-micro font-medium">{audienceLabel(product.audience)}</span>
          <span className="rounded-full bg-coral-50 px-3 py-1 text-micro font-medium text-coral-800">
            {product.status === "waitlist" ? "Waitlist open" : product.status === "beta" ? "Beta" : "Available"}
          </span>
        </div>
      </div>
      <Heading className="mt-6 text-h4">
        <TransitionLink href={`/products/${product.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-card">
          {product.name}
        </TransitionLink>
      </Heading>
      <p className="mt-2 text-body-l text-violet-600">{product.tagline}</p>
      <p className="mt-4 text-body text-ink/70">{product.summary}</p>
    </article>
  );
}
