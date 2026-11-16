"use client";

import { cx } from "@/lib/cx";

export type FilterOption = { id: string; label: string };

type FilterChipsProps = {
  options: FilterOption[];
  /** Selected option id. */
  value: string;
  onChange: (id: string) => void;
  /** Accessible name of the group, e.g. "Filter products by audience". */
  label: string;
  /** Announced politely after each change, e.g. "4 products". */
  liveMessage?: string;
  className?: string;
};

/**
 * A row of toggle chips. Each chip is a real button with aria-pressed, inside a labelled group.
 * The active chip is coral-tinted with coral-700 text (4.77:1 on canvas).
 */
export function FilterChips({ options, value, onChange, label, liveMessage, className }: FilterChipsProps) {
  return (
    <>
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cx(
              "min-h-11 rounded-tag px-4 text-label font-medium transition-[background-color,color,box-shadow] duration-250",
              active ? "bg-coral-500/12 text-coral-700" : "bg-white text-ink/80 shadow-tag hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
    {liveMessage !== undefined ? (
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
    ) : null}
    </>
  );
}
