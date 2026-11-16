import { cx } from "@/lib/cx";

type GlowProps = {
  /** Brand colour of the blob. */
  color?: "violet" | "coral" | "amber";
  /** Diameter in px (scaled down on phones). */
  size?: number;
  /** Tailwind position classes, e.g. "left-1/2 top-0 -translate-x-1/2". */
  className?: string;
  /** Strength at the centre, 0 to 1. */
  opacity?: number;
};

/** RGB channels of the brand colours. */
const colors = {
  violet: "109 74 255",
  coral: "255 107 61",
  amber: "255 138 61",
} as const;

/**
 * A large, soft colour blob placed behind section content. Decorative only (aria-hidden, pointer-events
 * none). The parent must be `relative` and clip overflow (Section does both).
 *
 * The softness comes from a radial gradient that fades to transparent at the edge, not from
 * `filter: blur()`: a 180 px blur on an element this size is expensive to paint, and when it was layered
 * over other composited backgrounds (the hero star-field) Chrome washed the whole section out to a pale
 * lavender.
 */
export function Glow({ color = "violet", size = 900, className, opacity = 0.45 }: GlowProps) {
  const rgb = colors[color];
  return (
    <div
      aria-hidden="true"
      className={cx("pointer-events-none absolute -z-10 rounded-full", className)}
      style={{
        width: `min(${size}px, 140vw)`,
        height: `min(${size}px, 140vw)`,
        background: `radial-gradient(closest-side, rgb(${rgb} / ${opacity}), rgb(${rgb} / ${opacity * 0.45}) 45%, rgb(${rgb} / 0))`,
      }}
    />
  );
}
