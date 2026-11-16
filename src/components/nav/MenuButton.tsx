"use client";

import { cx } from "@/lib/cx";
import type { NavTheme } from "./useNavTheme";

type MenuButtonProps = {
  open: boolean;
  onToggle: () => void;
  /** id of the menu this button controls. */
  controls: string;
  theme: NavTheme;
};

/**
 * The hamburger button, shown below 1024 px. Two lines morph into a cross when the menu is open.
 * A real <button> with aria-expanded and aria-controls, so screen readers announce its state.
 */
export function MenuButton({ open, onToggle, controls, theme }: MenuButtonProps) {
  const onDark = theme === "dark";
  const line = cx(
    "absolute left-1/2 h-[1.5px] w-[18px] -translate-x-1/2 rounded-full transition-transform duration-400 ease-[var(--ease-out-quint)]",
    onDark ? "bg-white" : "bg-ink",
  );
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onToggle}
      className={cx(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full backdrop-blur-xl lg:hidden",
        "transition-colors duration-300",
        onDark ? "bg-white/15 hover:bg-white/25" : "bg-ink/[0.06] hover:bg-ink/10",
      )}
    >
      <span aria-hidden className={cx(line, open ? "top-1/2 rotate-45" : "top-[calc(50%-4px)]")} />
      <span aria-hidden className={cx(line, open ? "top-1/2 -rotate-45" : "top-[calc(50%+3px)]")} />
    </button>
  );
}
