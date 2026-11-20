"use client";

import { FilterChips } from "@/components/ui/FilterChips";
import { FilterList } from "@/components/ui/FilterList";
import { products } from "@/content/products";
import { audiences } from "@/content/site";
import { useUrlFilter } from "@/hooks/useUrlFilter";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/motion/Reveal";

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
  const label = options.find((o) => o.id === audience)?.label ?? "All products";
  // Announced politely after each change, for screen-reader users who cannot see the grid re-flow.
  const liveMessage =
    audience === "all"
      ? `Showing all ${shown.length} products`
      : `Showing ${shown.length} ${shown.length === 1 ? "product" : "products"} for ${label}`;
  return (
    <>
      <FilterChips
        options={options}
        value={audience}
        onChange={setAudience}
        label="Filter products by audience"
        liveMessage={liveMessage}
      />
      {/* The list rises in as one block the first time it is reached; filtering then animates the cards. */}
      <Reveal preset="up75">
        <FilterList
          items={[...shown]}
          getKey={(p) => p.slug}
          renderItem={(p) => <ProductCard product={p} />}
          // Two columns from 700 px (324 px cards), three from 1200 px (357 px). The site's md and lg steps
          // left one 728 px card per row on an upright tablet and three 301 px cards at 1024 px.
          className="mt-10 gap-3 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-3"
          empty={
            <div className="mt-10 rounded-card bg-white px-7 py-12 text-center">
              <p className="text-h5">No products for {label} yet.</p>
              <p className="mt-2 text-body text-ink/70">Tell us what you need on the contact page, or see everything we are building.</p>
              <button
                type="button"
                onClick={() => setAudience("all")}
                className="mt-6 rounded-btn bg-ink px-5 py-3 text-label font-medium text-white"
              >
                Show all products
              </button>
            </div>
          }
        />
      </Reveal>
    </>
  );
}

/**
 * Server-rendered stand-in shown until the browser reads the URL: every product, no filter. It is also
 * what visitors without JavaScript (and the static export HTML) get, so all six products are always listed.
 */
export function ProductsListFallback() {
  return (
    <ul className="mt-[4.5rem] grid gap-3 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-3">
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
