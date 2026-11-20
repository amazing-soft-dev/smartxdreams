"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { cx } from "@/lib/cx";
import styles from "./PostCard.module.css";

type PostCardProps = {
  href: string;
  title: string;
  category: string;
  /** Date and reading time, e.g. "15 Nov 2026 · 3 min read". */
  meta: string;
  draft?: boolean;
  /** The cover, rendered on the server (a photo or a code-built cover). */
  cover: ReactNode;
  /** Featured: wide two-column card with the description and a "Read article" cue. */
  featured?: boolean;
  description?: string;
  headingLevel?: "h2" | "h3";
};

/**
 * A blog post card. The title is the card's only link, stretched over the whole card, so screen readers
 * hear one link per post and keyboard users get one tab stop with a visible focus ring.
 *
 * With a mouse (hover and a fine pointer, motion allowed), the card lifts, the cover drifts against the
 * pointer, a light sweep crosses it and a "Read" badge follows the pointer. PostCard.module.css holds
 * the effects; this component only tracks the pointer position in CSS variables.
 *
 * Keep every ancestor of the link between it and the <article> free of transform, translate, scale,
 * filter and similar properties: any of them would become the containing block of the link's ::after,
 * shrinking the clickable area to that ancestor (the cover would stop opening the post on hover). That is
 * why the hover lift sits on each line of text (styles.lift), not on the text column.
 */
export function PostCard({
  href,
  title,
  category,
  meta,
  draft,
  cover,
  featured,
  description,
  headingLevel: Heading = "h3",
}: PostCardProps) {
  const mediaRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const media = mediaRef.current;
    if (event.pointerType !== "mouse" || !media) return;
    const rect = media.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    media.style.setProperty("--bx", `${x}px`);
    media.style.setProperty("--by", `${y}px`);
    media.style.setProperty("--px", `${-(x / rect.width - 0.5) * 14}px`);
    media.style.setProperty("--py", `${-(y / rect.height - 0.5) * 10}px`);
  };

  return (
    <article
      onPointerMove={onPointerMove}
      className={cx(
        styles.card,
        "group relative h-full rounded-card bg-white p-2",
        featured ? "grid gap-2 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : "flex flex-col",
      )}
    >
      <div
        ref={mediaRef}
        className={cx(
          "relative isolate overflow-hidden rounded-[24px] bg-ink",
          featured ? "aspect-[16/10] md:aspect-auto md:min-h-96" : "aspect-[16/10]",
        )}
      >
        <div className={styles.image}>{cover}</div>
        <span aria-hidden="true" className={styles.sweep} />
        <span aria-hidden="true" className={styles.badge}>
          Read
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div className={cx("flex flex-1 flex-col", featured ? "justify-center p-5 md:p-8" : "px-4 pt-5 pb-4")}>
        <p className={cx(styles.lift, "flex flex-wrap items-center gap-2 text-label font-medium text-coral-700")}>
          {category}
          {draft ? <span className="rounded-full bg-ink/[0.07] px-2 py-0.5 text-micro text-ink/75">Draft</span> : null}
        </p>
        <Heading className={cx("mt-3", featured ? "text-h3" : "text-h6")}>
          <TransitionLink href={href} className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card">
            <span className={cx(styles.lift, "inline-block")}>{title}</span>
          </TransitionLink>
        </Heading>
        {description ? <p className={cx(styles.lift, "mt-4 text-body-l text-ink/70")}>{description}</p> : null}
        <p className={cx(styles.lift, "text-label text-ink/60", featured ? "mt-6" : "mt-auto pt-4")}>{meta}</p>
        {featured ? (
          <span
            aria-hidden="true"
            className={cx(styles.lift, "mt-8 inline-flex w-fit items-center gap-2 text-label font-medium text-ink")}
          >
            Read article
            {/* The arrow turns up and out on hover and focus, to the pose Beemas' arrows rest in. */}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="inline-block transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:-rotate-30 group-has-[a:focus-visible]:-rotate-30 motion-reduce:transition-none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
      </div>
    </article>
  );
}
