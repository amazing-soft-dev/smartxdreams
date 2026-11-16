"use client";

import { useReducedMotion } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";

export type SelectionTarget = {
  /** Index of the word in the headline (split on spaces). */
  word: number;
};

type SelectionHeadlineProps = {
  text: string;
  targets: readonly SelectionTarget[];
  id?: string;
  className?: string;
};

/** How long the box rests on each word, and how long the move takes. */
export const SELECTION_CYCLE_MS = 2350;
export const SELECTION_MOVE_MS = 650;

type Box = { x: number; y: number; width: number; height: number };

/**
 * A headline with a design-tool style selection box that hops from word to word: a 1 px violet outline with
 * a light fill and corner handles. The box is decorative (aria-hidden); the heading text is read normally.
 * Under reduced motion it rests on the first target and never moves.
 */
export function SelectionHeadline({ text, targets, id, className }: SelectionHeadlineProps) {
  const words = text.split(" ");
  const heading = useRef<HTMLHeadingElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const target = targets[step % targets.length];

  // Advance to the next word on a fixed rhythm.
  useEffect(() => {
    if (reduced || targets.length < 2) return;
    const timer = window.setInterval(() => setStep((s) => s + 1), SELECTION_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduced, targets.length]);

  // Measure the selected word relative to the heading, and again when the layout changes size.
  useEffect(() => {
    const measure = () => {
      const el = target ? wordRefs.current[target.word] : null;
      const root = heading.current;
      if (!el || !root) return;
      const a = el.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      setBox({ x: a.left - b.left, y: a.top - b.top, width: a.width, height: a.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (heading.current) observer.observe(heading.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <h1 ref={heading} id={id} className={`relative ${className ?? ""}`}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className="inline-block"
          >
            {word}
          </span>{" "}
        </Fragment>
      ))}
      {box ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 rounded-[2px] border border-violet-300 bg-violet-300/10"
          style={{
            transform: `translate(${box.x - 6}px, ${box.y + 2}px)`,
            width: box.width + 12,
            height: box.height - 4,
            transition: reduced
              ? undefined
              : `transform ${SELECTION_MOVE_MS}ms cubic-bezier(0.7, 0, 0.2, 1), width ${SELECTION_MOVE_MS}ms cubic-bezier(0.7, 0, 0.2, 1), height ${SELECTION_MOVE_MS}ms cubic-bezier(0.7, 0, 0.2, 1)`,
          }}
        >
          {(["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"] as const).map((pos) => (
            <span key={pos} className={`absolute ${pos} size-2 rounded-[1px] border border-violet-300 bg-ink`} />
          ))}
        </span>
      ) : null}
    </h1>
  );
}
