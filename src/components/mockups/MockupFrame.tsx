import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type MockupFrameProps = {
  /** Product name shown in the frame's title bar. */
  title: string;
  /** Short line under the title, such as what the screen shows. */
  caption?: string;
  children: ReactNode;
  className?: string;
  /** Light card (default) or ink card. */
  tone?: "light" | "dark";
};

/**
 * Shared frame for the code-built product mockups: a small app window with a title bar and three dots.
 * Mockups are illustrations, so the frame is aria-hidden by default; pages describe the product in text.
 */
export function MockupFrame({ title, caption, children, className, tone = "light" }: MockupFrameProps) {
  const dark = tone === "dark";
  return (
    <div
      aria-hidden="true"
      className={cx(
        "flex flex-col overflow-hidden rounded-[22px] text-left shadow-[0_24px_60px_rgb(0_0_0/0.35)] ring-1",
        dark ? "bg-ink-800 text-white ring-white/10" : "bg-white text-ink ring-ink/5",
        className,
      )}
    >
      <div className={cx("flex items-center gap-2 border-b px-4 py-3", dark ? "border-white/10" : "border-ink/5")}>
        <span className="flex gap-1">
          {["bg-coral-400", "bg-violet-300", dark ? "bg-white/30" : "bg-ink/15"].map((c) => (
            <span key={c} className={cx("size-2 rounded-full", c)} />
          ))}
        </span>
        <span className="ml-1 text-[0.8125rem] font-medium">{title}</span>
        {caption ? (
          <span className={cx("ml-auto truncate text-[0.6875rem]", dark ? "text-white/55" : "text-ink/65")}>{caption}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 text-[0.75rem] leading-snug">{children}</div>
    </div>
  );
}
