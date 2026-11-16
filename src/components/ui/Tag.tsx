import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type TagProps = {
  children: ReactNode;
  /** "light" for light surfaces (white pill with the layered shadow), "dark" for dark surfaces (glass). */
  tone?: "light" | "dark";
  /** Optional 16 px icon before the label. Decorative. */
  icon?: ReactNode;
  className?: string;
};

/** Eyebrow pill above section titles ("Products", "How we build"). */
export function Tag({ children, tone = "light", icon, className }: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-tag px-2.5 py-1.5 text-label font-medium",
        tone === "light" ? "bg-white text-ink shadow-tag" : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
