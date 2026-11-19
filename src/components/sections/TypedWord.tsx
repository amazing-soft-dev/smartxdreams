"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useMotionPaused } from "@/components/motion/motion-pause";

type TypedWordProps = {
  /** Words to cycle through. */
  words: readonly string[];
  /** Shown instead of the animation when the visitor prefers reduced motion. */
  staticText: string;
  className?: string;
};

const TYPE_MS = 70;
const DELETE_MS = 40;
const HOLD_MS = 1600;

/**
 * Types each word letter by letter, holds it, deletes it, and moves on, with a blinking caret.
 * Visual only (aria-hidden): the surrounding heading carries a static text alternative. Under reduced motion
 * it shows staticText with no typing and no caret. Both are rendered and CSS picks one (motion-reduce:), so the
 * server and client markup match: useReducedMotion() is null on the server and only steers the typing effect.
 */
export function TypedWord({ words, staticText, className }: TypedWordProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const word = words[index % words.length] ?? "";

  // Paused by the visitor (the footer's switch): the letters typed so far stay, and typing carries on from
  // them afterwards. The caret's blink is held in CSS (globals.css).
  const paused = useMotionPaused();
  useEffect(() => {
    if (reduced || paused) return;
    let delay = deleting ? DELETE_MS : TYPE_MS;
    if (!deleting && length === word.length) delay = HOLD_MS;
    const timer = window.setTimeout(() => {
      if (!deleting && length === word.length) setDeleting(true);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else setLength((n) => n + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, length, word.length, reduced, paused]);

  return (
    <span aria-hidden="true" data-motion="typed" className={className}>
      <span className="hidden motion-reduce:inline">{staticText}</span>
      <span className="motion-reduce:hidden">
        {word.slice(0, length)}
        <span className="ml-0.5 inline-block w-[0.06em] animate-[caret-blink_1s_step-end_infinite] bg-current align-[-0.08em]">
          &nbsp;
        </span>
      </span>
    </span>
  );
}
