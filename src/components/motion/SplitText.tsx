"use client";

import { animate, inView } from "motion";
import { Fragment, useEffect, useRef } from "react";
import { PAGE_REVEALED } from "@/components/transition/TransitionProvider";
import { spring, stagger } from "@/styles/motion";

type SplitTextProps = {
  /** Heading text; *starred words* are the accent, as for Accent. */
  text: string;
  /** Surface the text sits on, for the accent colour. */
  tone?: "light" | "dark";
  /** Above the fold: rise on mount instead of when scrolled into view. */
  aboveFold?: boolean;
  /** Extra seconds before the first line starts. */
  delay?: number;
};

/** Offset each word starts from, in px (Beemas: 75). */
const RISE = 75;

/** Words, each tagged with whether it is part of an accent. */
function words(text: string): { word: string; accent: boolean }[] {
  return text.split(/\*([^*]+)\*/g).flatMap((part, i) =>
    part
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, accent: i % 2 === 1 })),
  );
}

/**
 * A heading that rises in line by line, as Beemas' do (docs/motion-audit.md): each word starts 75 px low
 * and almost transparent, and when the heading comes into view every line rises on spring.rise, 0.16 s
 * after the line above it.
 *
 * Beemas splits into letters, but the letters of a line move together, so splitting into words looks the
 * same and keeps kerning and ligatures intact. Lines are found after layout, from each word's position, so
 * they follow the heading's real wrapping at any width.
 *
 * The words stay real text in reading order, so the heading's text (what screen readers, search engines
 * and tests read) is exactly the original sentence, once. Without JavaScript (data-reveal) or with reduced
 * motion (data-motion) the words show in place.
 */
export function SplitText({ text, tone = "light", aboveFold = false, delay = 0 }: SplitTextProps) {
  const root = useRef<HTMLSpanElement>(null);
  const accent = tone === "dark" ? "text-violet-300" : "text-violet-500";

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rise = () => {
      // Group the words into lines by where they sit now.
      const lines = new Map<number, HTMLElement[]>();
      for (const word of el.querySelectorAll<HTMLElement>("[data-word]")) {
        const top = Math.round(word.offsetTop);
        lines.set(top, [...(lines.get(top) ?? []), word]);
      }
      [...lines.keys()]
        .sort((a, b) => a - b)
        .forEach((top, i) => {
          animate(lines.get(top)!, { opacity: 1, y: 0 }, { ...spring.rise, delay: delay + stagger.lineDelay + i * stagger.line });
        });
    };
    if (aboveFold) {
      // Arriving through the page transition: wait for the panels to start leaving, so the title rises as
      // it comes into sight (with a fallback, should the transition never finish).
      if (document.documentElement.dataset.pageCovered !== undefined) {
        const go = () => {
          window.clearTimeout(fallback);
          rise();
        };
        const fallback = window.setTimeout(go, 2000);
        window.addEventListener(PAGE_REVEALED, go, { once: true });
        return () => {
          window.clearTimeout(fallback);
          window.removeEventListener(PAGE_REVEALED, go);
        };
      }
      rise();
      return;
    }
    return inView(el, () => rise(), { amount: 0.2 });
  }, [aboveFold, delay]);

  const list = words(text);
  return (
    <>
      <span ref={root}>
        {list.map(({ word, accent: isAccent }, i) => (
          <Fragment key={i}>
            <span
              data-word=""
              data-reveal=""
              data-motion="rise"
              className={isAccent ? `inline-block ${accent}` : "inline-block"}
              style={{ opacity: 0.001, transform: `translateY(${RISE}px)` }}
            >
              {word}
            </span>
            {i < list.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}
