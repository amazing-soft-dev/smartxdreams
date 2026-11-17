"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { type FilterOption, FilterChips } from "@/components/ui/FilterChips";
import { FilterList } from "@/components/ui/FilterList";
import { useUrlFilter } from "@/hooks/useUrlFilter";

/** Articles per step. "Show more" appears only when a view has more than this. */
export const BLOG_PAGE_SIZE = 9;

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
 *
 * Long views show BLOG_PAGE_SIZE articles and a "Show more" button that reveals the next set and moves
 * focus to the first new card. The button exists only when there is more to show: no dead "load more".
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

  // How many articles each filter view shows; a new filter starts at one page.
  const [limits, setLimits] = useState<Record<string, number>>({});
  const limit = limits[category] ?? BLOG_PAGE_SIZE;
  const visible = shown.slice(0, limit);
  const remaining = shown.length - visible.length;

  // After "Show more", focus moves to the first newly shown card so keyboard users continue from there.
  const focusSlug = useRef<string | null>(null);
  useEffect(() => {
    if (!focusSlug.current) return;
    document.getElementById(`post-card-${focusSlug.current}`)?.querySelector<HTMLAnchorElement>("a")?.focus();
    focusSlug.current = null;
  }, [limit]);

  const showMore = () => {
    focusSlug.current = shown[limit]?.slug ?? null;
    setLimits((prev) => ({ ...prev, [category]: limit + BLOG_PAGE_SIZE }));
  };
  return (
    <>
      {/* The margin sits on a wrapper so it does not override the chips' own negative margins. */}
      <div className="mt-8">
        <FilterChips
          options={options}
          value={category}
          onChange={setCategory}
          label="Filter articles by category"
          liveMessage={category === "all" ? `Showing all articles` : `Showing ${count} in ${label}`}
        />
      </div>
      <FilterList
        items={visible}
        getKey={(i) => i.slug}
        renderItem={(i) => (
          <div id={`post-card-${i.slug}`} className="h-full">
            {i.card}
          </div>
        )}
        className="mt-10 gap-3 md:grid-cols-2 lg:grid-cols-3"
        empty={<p className="mt-10 text-body-l text-ink/70">No other articles yet. The featured post above is the newest.</p>}
      />
      {remaining > 0 ? (
        <div className="mt-12 flex justify-center">
          <Button type="button" variant="ink" onClick={showMore}>
            {`Show ${Math.min(remaining, BLOG_PAGE_SIZE)} more ${Math.min(remaining, BLOG_PAGE_SIZE) === 1 ? "article" : "articles"}`}
          </Button>
        </div>
      ) : null}
    </>
  );
}
