import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Container } from "./Container";

export type Surface = "canvas" | "canvas-200" | "white" | "dark";

const surfaces: Record<Surface, string> = {
  canvas: "bg-canvas text-ink",
  "canvas-200": "bg-canvas-200 text-ink",
  white: "bg-white text-ink",
  dark: "bg-ink text-white",
};

type SectionProps = {
  children: ReactNode;
  /** Background and text colour. "dark" also sets data-surface="dark" for focus rings and the header theme. */
  surface?: Surface;
  as?: ElementType;
  id?: string;
  /** Id of the heading that names the section (aria-labelledby). */
  labelledBy?: string;
  className?: string;
  /** Wrap children in the content-width Container (default true). */
  contained?: boolean;
};

/**
 * A page section with the site's vertical rhythm: 72 px padding on phones, 96 px on tablets and
 * 112 px on desktop. Sections clip overflow so decorative glows never cause horizontal scrolling.
 */
export function Section({
  children,
  surface = "canvas",
  as: Tag = "section",
  id,
  labelledBy,
  className,
  contained = true,
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      data-surface={surface === "dark" ? "dark" : "light"}
      data-nav-theme={surface === "dark" ? "dark" : "light"}
      className={cx("relative overflow-clip py-18 md:py-24 xl:py-28", surfaces[surface], className)}
    >
      {contained ? <Container className="relative">{children}</Container> : children}
    </Tag>
  );
}
