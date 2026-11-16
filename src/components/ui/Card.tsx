import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type CardTone = "white" | "canvas" | "glass" | "glass-dark" | "ink" | "gradient-coral" | "gradient-violet";

const tones: Record<CardTone, string> = {
  white: "bg-white text-ink",
  canvas: "bg-canvas-200 text-ink",
  /** Glass on light sections. */
  glass: "bg-ink/[0.06] text-ink ring-1 ring-ink/10 backdrop-blur-[15px]",
  /** Glass on dark sections and over images. */
  "glass-dark": "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-[15px]",
  ink: "bg-ink text-white",
  /** Coral to ink: text stays white, which passes on the ink end where copy sits. */
  "gradient-coral": "bg-[linear-gradient(160deg,#FF6B3D_0%,#932F15_45%,#0F1226_100%)] text-white",
  "gradient-violet": "bg-[linear-gradient(160deg,#6D4AFF_0%,#371D93_50%,#0F1226_100%)] text-white",
};

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  as?: ElementType;
  /** Padding preset: md is 24 px, lg is 32 px from tablet up. */
  padding?: "none" | "md" | "lg";
  className?: string;
};

/** The site's card: 30 px radius, clipped corners, and a tone from the brand palette. */
export function Card({ children, tone = "white", as: Tag = "div", padding = "md", className }: CardProps) {
  return (
    <Tag
      data-surface={tone === "white" || tone === "canvas" || tone === "glass" ? "light" : "dark"}
      className={cx(
        "relative isolate overflow-hidden rounded-card",
        padding === "md" && "p-6",
        padding === "lg" && "p-6 md:p-8",
        tones[tone],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
