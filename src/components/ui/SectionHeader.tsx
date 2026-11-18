import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Tag } from "./Tag";

type SectionHeaderProps = {
  /** Eyebrow label above the title. */
  tag?: string;
  tagIcon?: ReactNode;
  /** Title with optional *accent* words. */
  title: string;
  description?: string;
  /** Heading level; visual size is always the h2 token. Use "h1" only for page heroes. */
  as?: "h1" | "h2" | "h3";
  /** Id for the heading, so the section can point aria-labelledby at it. */
  id?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Tag, title and description: the opening of most sections. They come in in that order, as Ignivo's and
 * Beemas' section headers do: the tag rises first, the title's lines rise after it (SplitText), and the
 * description follows once the first line has started.
 */
export function SectionHeader({
  tag,
  tagIcon,
  title,
  description,
  as: Heading = "h2",
  id,
  align = "center",
  tone = "light",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div className={cx("flex max-w-3xl flex-col gap-5", centered ? "mx-auto items-center text-center" : "items-start", className)}>
      {tag ? (
        <Reveal preset="up35">
          <Tag tone={tone} icon={tagIcon}>
            {tag}
          </Tag>
        </Reveal>
      ) : null}
      <div className={cx("flex flex-col gap-3", centered && "items-center")}>
        <Heading id={id} className="text-h2">
          <SplitText text={title} tone={tone} delay={tag ? 0.1 : 0} />
        </Heading>
        {description ? (
          <Reveal preset="up35" delay={0.45}>
            <p className={cx("max-w-2xl text-body-l", tone === "dark" ? "text-white/65" : "text-ink/65")}>{description}</p>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
