"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/cx";
import type { Faq } from "@/content/types";

type AccordionProps = {
  items: Faq[];
  /** Index open on first render; -1 for none. */
  defaultOpen?: number;
  /** Allow several items open at once. */
  multiple?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Disclosure accordion following the WAI-ARIA pattern: each question is a button with aria-expanded
 * and aria-controls, and each answer is a labelled region.
 */
export function Accordion({ items, defaultOpen = 0, multiple = false, tone = "light", className }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<number[]>(defaultOpen >= 0 ? [defaultOpen] : []);

  const toggle = (index: number) => {
    setOpen((current) => {
      if (current.includes(index)) return current.filter((i) => i !== index);
      return multiple ? [...current, index] : [index];
    });
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {items.map((item, index) => {
        const isOpen = open.includes(index);
        const buttonId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;
        return (
          <div
            key={item.question}
            className={cx(
              "rounded-[20px] transition-colors duration-300",
              tone === "light"
                ? isOpen
                  ? "bg-white shadow-tag"
                  : "bg-ink/[0.05]"
                : isOpen
                  ? "bg-white/12"
                  : "bg-white/[0.06]",
            )}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left text-body-l md:px-6"
              >
                {item.question}
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <p className={cx("px-5 pb-5 md:px-6", tone === "light" ? "text-ink/65" : "text-white/65")}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
