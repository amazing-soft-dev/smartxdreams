import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";
import { InPageLink } from "./InPageLink";

export type ButtonVariant = "coral" | "ink" | "white" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/** Colour pairs from docs/design-tokens.md: coral buttons always use ink text (white fails contrast). */
const variants: Record<ButtonVariant, { button: string; tile: string }> = {
  coral: { button: "bg-coral-500 text-ink", tile: "bg-white text-ink" },
  ink: { button: "bg-ink text-white", tile: "bg-white text-ink" },
  white: { button: "bg-white text-ink shadow-tag", tile: "bg-ink text-white" },
  ghost: { button: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md", tile: "bg-white text-ink" },
};

const sizes: Record<ButtonSize, { button: string; tile: string }> = {
  sm: { button: "h-10 gap-3 pl-4 pr-1 text-label", tile: "size-8" },
  md: { button: "h-12 gap-4 pl-5 pr-2 text-label", tile: "size-8" },
  lg: { button: "h-14 gap-5 pl-6 pr-2 text-body", tile: "size-10" },
};

type CommonProps = {
  /** Visible label. Rendered once for screen readers, and as two animated letter rows for sighted users. */
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the icon tile with the arrow (default true). */
  icon?: boolean;
  /** Replace the arrow with a custom 16 px icon. */
  iconSlot?: ReactNode;
  className?: string;
};

type LinkButtonProps = CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "children" | "className">;
type NativeButtonProps = CommonProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

export type ButtonProps = LinkButtonProps | NativeButtonProps;

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <path d="M4.5 11.5l7-7M6 4.5h5.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The label as two stacked rows of letters; the hover effect rolls the top row up and the second row in. */
function RollingLabel({ text }: { text: string }) {
  const letters = Array.from(text);
  const row = (offset: "top" | "bottom") => (
    <span className={cx(styles.row, offset === "bottom" && styles.rowBottom)}>
      {letters.map((letter, i) => (
        <span key={i} className={styles.letter} style={{ "--i": i, "--n": letters.length } as CSSProperties}>
          {letter === " " ? " " : letter}
        </span>
      ))}
    </span>
  );
  return (
    <span className={styles.label} aria-hidden="true">
      {row("top")}
      {row("bottom")}
    </span>
  );
}

/**
 * The site's button. Renders a Next.js Link when href is set, otherwise a native button.
 * Hover effects (letter roll, shine sweep, tile tilt, arrow hop, press) run only for fine pointers
 * with hover, and never under reduced motion; see Button.module.css.
 */
export function Button({ children, variant = "coral", size = "md", icon = true, iconSlot, className, ...rest }: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const classes = cx(
    styles.button,
    "relative isolate inline-flex shrink-0 items-center overflow-hidden rounded-btn font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50",
    v.button,
    s.button,
    !icon && "pr-5",
    className,
  );
  const content = (
    <>
      <span className="sr-only">{children}</span>
      <RollingLabel text={children} />
      {icon ? (
        <span className={cx(styles.tile, "inline-flex items-center justify-center rounded-[10px]", v.tile, s.tile)} aria-hidden="true">
          <span className={styles.arrow}>{iconSlot ?? <Arrow />}</span>
        </span>
      ) : null}
      <span className={styles.shine} aria-hidden="true" />
    </>
  );

  if (rest.href !== undefined) {
    const linkProps = rest as Omit<LinkButtonProps, keyof CommonProps>;
    // A link to a section of the same page ("#waitlist") also moves keyboard focus there.
    const Anchor = linkProps.href.startsWith("#") ? InPageLink : Link;
    return (
      <Anchor {...linkProps} className={classes}>
        {content}
      </Anchor>
    );
  }
  const buttonProps = rest as Omit<NativeButtonProps, keyof CommonProps | "href">;
  return (
    <button type="button" {...buttonProps} className={classes}>
      {content}
    </button>
  );
}
