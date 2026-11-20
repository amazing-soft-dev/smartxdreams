"use client";

import { animate, inView } from "motion";
import { Fragment, useEffect, useRef } from "react";
import { PAGE_REVEALED } from "@/components/transition/TransitionProvider";
import { spring, stagger } from "@/styles/motion";

type SplitTextProps = {
  /** Heading text; *starred words* are the accent, e.g. "Every job, *one search*." */
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

type Piece = { text: string; accent: boolean };

/**
 * The heading as words, each a list of pieces tagged with whether they are part of an accent. Most words are
 * one piece. Text that touches an accent without a space stays in the same word as a piece of its own: the
 * full stop in "Send us a *message*." and the comma in "the *paperwork*, so" belong to the word before them,
 * in the plain colour. As separate words they would be set a space apart ("message .").
 */
function words(text: string): Piece[][] {
  const list: Piece[][] = [];
  // True while the text so far ends without a space, so the next piece continues the last word.
  let open = false;
  text.split(/\*([^*]+)\*/g).forEach((part, i) => {
    if (part === "") return;
    // An empty first or last entry marks a space at that end of the part.
    const pieces = part.split(/\s+/);
    pieces.forEach((piece, j) => {
      if (piece === "") return;
      const last = list[list.length - 1];
      if (j === 0 && open && last) last.push({ text: piece, accent: i % 2 === 1 });
      else list.push([{ text: piece, accent: i % 2 === 1 }]);
    });
    open = pieces[pieces.length - 1] !== "";
  });
  return list;
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
        {list.map((pieces, i) => {
          // One piece: the word itself carries the colour. Several: each accent piece is coloured inside it.
          const only = pieces.length === 1 ? pieces[0] : undefined;
          return (
            <Fragment key={i}>
              <span
                data-word=""
                data-reveal=""
                data-motion="rise"
                className={only?.accent ? `inline-block ${accent}` : "inline-block"}
                style={{ opacity: 0.001, transform: `translateY(${RISE}px)` }}
              >
                {only
                  ? only.text
                  : pieces.map((piece, j) => (
                      <Fragment key={j}>{piece.accent ? <span className={accent}>{piece.text}</span> : piece.text}</Fragment>
                    ))}
              </span>
              {i < list.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </span>
    </>
  );
}
