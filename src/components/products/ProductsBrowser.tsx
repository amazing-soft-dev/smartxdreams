"use client";

import { useState } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { FilterList } from "@/components/ui/FilterList";
import { products } from "@/content/products";
import { audiences } from "@/content/site";
import { ProductCard } from "./ProductCard";

/** Audience options that have at least one product, after "All". */
const options = [
  { id: "all", label: "All products" },
  ...audiences.filter((a) => products.some((p) => p.audience === a.id)).map((a) => ({ id: a.id, label: a.label })),
];

/** The product list with audience filter chips. */
export function ProductsBrowser() {
  const [audience, setAudience] = useState("all");
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
