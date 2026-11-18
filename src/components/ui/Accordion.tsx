"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import type { Faq } from "@/content/types";
import { Reveal } from "@/components/motion/Reveal";
import { stagger } from "@/styles/motion";

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

  const root = useRef<HTMLDivElement>(null);

  // Arrow keys move between questions; Home and End jump to the first and last.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const triggers = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]") ?? []);
    const current = triggers.indexOf(event.currentTarget);
    const last = triggers.length - 1;
    const target =
      event.key === "ArrowDown"
        ? current === last
          ? 0
          : current + 1
        : event.key === "ArrowUp"
          ? current === 0
            ? last
            : current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (target < 0) return;
    event.preventDefault();
    triggers[target]?.focus();
  };

  const toggle = (index: number) => {
    setOpen((current) => {
      if (current.includes(index)) return current.filter((i) => i !== index);
      return multiple ? [...current, index] : [index];
    });
  };

  return (
    <div ref={root} className={cx("flex flex-col gap-2", className)}>
      {items.map((item, index) => {
        const isOpen = open.includes(index);
        const buttonId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;
        return (
          <Reveal
            key={item.question}
            preset="up50"
            delay={index * (stagger.group / 2)}
            className={cx(
              "rounded-[20px] transition-colors duration-300",
              tone === "light" ? (isOpen ? "bg-white shadow-tag" : "bg-ink/[0.05]") : isOpen ? "bg-white/12" : "bg-white/[0.06]",
            )}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-accordion-trigger=""
                onClick={() => toggle(index)}
                onKeyDown={onKeyDown}
                className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left text-body-l md:px-6"
              >
                {item.question}
                <PlusIcon open={isOpen} tone={tone} />
              </button>
            </h3>
            {/* grid-template-rows 0fr -> 1fr animates to the content's natural height without measuring it, on
                the rise curve (--ease-rise) the rest of the page moves on. Closed answers are inert, so they
                are hidden from keyboard and screen readers. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={cx(
                "grid transition-[grid-template-rows,opacity] duration-700 ease-[var(--ease-rise)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className={cx("px-5 pb-5 md:px-6", tone === "light" ? "text-ink/65" : "text-white/65")}>{item.answer}</p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/** Plus that turns into a minus: the vertical bar rotates flat with a slight overshoot. */
function PlusIcon({ open, tone }: { open: boolean; tone: "light" | "dark" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-[var(--ease-back)] hover:scale-108 motion-reduce:hover:scale-100",
        tone === "light" ? "bg-ink text-white" : "bg-white text-ink",
      )}
    >
      <span className="absolute h-0.5 w-3 rounded-full bg-current" />
      <span
        className={cx(
          "absolute h-3 w-0.5 rounded-full bg-current transition-transform duration-400 ease-[var(--ease-back)]",
          open && "rotate-90",
        )}
      />
    </span>
  );
}
