"use client";

import type { ReactNode } from "react";
import { type FilterOption, FilterChips } from "@/components/ui/FilterChips";
import { FilterList } from "@/components/ui/FilterList";
import { useUrlFilter } from "@/hooks/useUrlFilter";

export type BlogItem = {
  slug: string;
  category: string;
  /** The card, rendered on the server. */
  card: ReactNode;
};

type BlogBrowserProps = {
  items: BlogItem[];
  /** "All" first, then the categories that have posts. */
  options: FilterOption[];
  /** Shown above the grid already, so "All" leaves it out; a category view includes it. */
  featuredSlug?: string;
};

/**
 * The article grid with category chips. The filter lives in the URL (?category=construction), so a
 * filtered view can be shared and the back button works. Cards re-flow with the shared FilterList
 * animation, and each change is announced politely.
 */
export function BlogBrowser({ items, options, featuredSlug }: BlogBrowserProps) {
  const [category, setCategory] = useUrlFilter(
    "category",
    options.map((o) => o.id),
    "all",
  );
  const shown = category === "all" ? items.filter((i) => i.slug !== featuredSlug) : items.filter((i) => i.category === category);
  const label = options.find((o) => o.id === category)?.label ?? "All";
  const count = `${shown.length} ${shown.length === 1 ? "article" : "articles"}`;
  return (
    <>
      <FilterChips
        options={options}
        value={category}
        onChange={setCategory}
        label="Filter articles by category"
        liveMessage={category === "all" ? `Showing all articles` : `Showing ${count} in ${label}`}
        className="mt-8"
      />
      <FilterList
        items={shown}
        getKey={(i) => i.slug}
        renderItem={(i) => i.card}
        className="mt-10 gap-3 md:grid-cols-2 lg:grid-cols-3"
        empty={<p className="mt-10 text-body-l text-ink/70">No other articles yet. The featured post above is the newest.</p>}
      />
    </>
  );
}
