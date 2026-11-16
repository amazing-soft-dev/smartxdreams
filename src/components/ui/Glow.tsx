import { cx } from "@/lib/cx";

type GlowProps = {
  /** Brand colour of the blob. */
  color?: "violet" | "coral" | "amber";
  /** Diameter in px (scaled down on phones). */
  size?: number;
  /** Tailwind position classes, e.g. "left-1/2 top-0 -translate-x-1/2". */
  className?: string;
  /** 0 to 1. */
  opacity?: number;
};

const colors = {
  violet: "#6D4AFF",
  coral: "#FF6B3D",
  amber: "#FF8A3D",
} as const;

/**
 * A large, heavily blurred colour blob placed behind section content. Decorative only (aria-hidden,
 * pointer-events none). The parent must be `relative` and clip overflow (Section does both).
 */
export function Glow({ color = "violet", size = 900, className, opacity = 0.45 }: GlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("pointer-events-none absolute -z-10 rounded-full blur-[120px] md:blur-[180px]", className)}
      style={{
        width: `min(${size}px, 140vw)`,
        height: `min(${size}px, 140vw)`,
        background: colors[color],
        opacity,
      }}
    />
  );
}
