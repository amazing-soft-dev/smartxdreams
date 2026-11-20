"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import type { Heading } from "@/lib/blog/headings";

/**
 * Marks the section being read: the last heading that has scrolled past the top fifth of the viewport.
 * Only the link styles change (colour and a border), so there is nothing to reduce for reduced motion.
 */
function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const update = () => {
      const line = window.innerHeight * 0.2;
      let current: string | undefined;
      for (const el of elements) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    const observer = new IntersectionObserver(update, { rootMargin: "0px 0px -80% 0px", threshold: [0, 1] });
    elements.forEach((el) => observer.observe(el));
    update();
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function Links({ headings, active }: { headings: Heading[]; active?: string }) {
  return (
    <ol className="flex flex-col border-l border-ink/10">
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={h.id === active ? "location" : undefined}
            className={cx(
              "-ml-px flex min-h-11 items-center border-l py-1.5 text-label transition-colors",
              h.depth === 3 ? "pl-7" : "pl-4",
              h.id === active
                ? "border-violet-500 font-medium text-ink"
                : "border-transparent text-ink/65 hover:border-ink/40 hover:text-ink",
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * The post's table of contents. Desktop: a list that stays in view beside the text and marks the section
 * being read. Phones and tablets: a collapsed "On this page" disclosure above the text. Plain anchor links,
 * so it works without JavaScript; the active marker is the only scripted part.
 */
export function TableOfContents({ headings, variant }: { headings: Heading[]; variant: "sidebar" | "inline" }) {
  const active = useActiveHeading(headings.map((h) => h.id));
  if (variant === "inline") {
    return (
      <details className="group mb-4 rounded-bar bg-canvas px-5 py-3 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-label font-medium text-ink">
          On this page
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            className="transition-transform group-open:rotate-180 motion-reduce:transition-none"
          >
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <nav aria-label="On this page" className="mt-3 pb-2">
          <Links headings={headings} active={active} />
        </nav>
      </details>
    );
  }
  return (
    <nav aria-labelledby="toc-title" className="sticky top-28 hidden lg:block">
      <h2 id="toc-title" className="text-label font-medium text-ink">
        On this page
      </h2>
      <div className="mt-4">
        <Links headings={headings} active={active} />
      </div>
    </nav>
  );
}
