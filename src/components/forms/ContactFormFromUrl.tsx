"use client";

import { useSearchParams } from "next/navigation";
import { ContactForm, type ProductOption } from "./ContactForm";

/**
 * The contact form, preselecting the product named in ?product= (product pages link here with it).
 * Unknown slugs are ignored. Reading search params needs a Suspense boundary, so the page renders a plain
 * ContactForm as the fallback, which is also what the static HTML contains.
 */
export function ContactFormFromUrl({ products }: { products: ProductOption[] }) {
  const slug = useSearchParams().get("product");
  const known = products.find((p) => p.slug === slug)?.slug;
  return <ContactForm key={known ?? "none"} products={products} defaultProduct={known} />;
}
