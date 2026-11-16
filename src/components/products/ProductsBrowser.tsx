"use client";

import { FilterChips } from "@/components/ui/FilterChips";
import { FilterList } from "@/components/ui/FilterList";
import { products } from "@/content/products";
import { audiences } from "@/content/site";
import { useUrlFilter } from "@/hooks/useUrlFilter";
import { ProductCard } from "./ProductCard";

/** Audience options that have at least one product, after "All". */
const options = [
  { id: "all", label: "All products" },
  ...audiences.filter((a) => products.some((p) => p.audience === a.id)).map((a) => ({ id: a.id, label: a.label })),
];

/** The product list with audience filter chips. The filter lives in the URL (?audience=seniors), so a
 * filtered view can be shared and the back button works. */
export function ProductsBrowser() {
  const [audience, setAudience] = useUrlFilter(
    "audience",
    options.map((o) => o.id),
    "all",
  );
  const shown = audience === "all" ? products : products.filter((p) => p.audience === audience);
  return (
    <>
      <FilterChips options={options} value={audience} onChange={setAudience} label="Filter products by audience" />
      <FilterList
        items={[...shown]}
        getKey={(p) => p.slug}
        renderItem={(p) => <ProductCard product={p} />}
        className="mt-10 gap-3 md:grid-cols-2 lg:grid-cols-3"
      />
    </>
  );
}

/**
 * Server-rendered stand-in shown until the browser reads the URL: every product, no filter. It is also
 * what visitors without JavaScript (and the static export HTML) get, so all six products are always listed.
 */
export function ProductsListFallback() {
  return (
    <ul className="mt-[4.5rem] grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
