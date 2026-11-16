import { TransitionLink } from "@/components/transition/TransitionLink";
import { audienceLabel } from "@/content/selectors";
import type { Product } from "@/content/types";

/** A product as a card: audience and status pills, name (the link), tagline and summary. One link per card. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <article
      data-product={product.slug}
      className="group relative flex h-full flex-col rounded-[30px] bg-white p-7 outline-offset-4 transition-[translate,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 hover:shadow-card-hover has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-violet-500"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-ink/[0.07] px-3 py-1 text-micro font-medium">{audienceLabel(product.audience)}</span>
        <span className="rounded-full bg-coral-50 px-3 py-1 text-micro font-medium text-coral-800">
          {product.status === "waitlist" ? "Waitlist open" : product.status === "beta" ? "Beta" : "Available"}
        </span>
      </div>
      <h2 className="mt-6 text-h4">
        <TransitionLink href={`/products/${product.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-[30px]">
          {product.name}
        </TransitionLink>
      </h2>
      <p className="mt-2 text-body-l text-violet-600">{product.tagline}</p>
      <p className="mt-4 text-body text-ink/70">{product.summary}</p>
    </article>
  );
}
