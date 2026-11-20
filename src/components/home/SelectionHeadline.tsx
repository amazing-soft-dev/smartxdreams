"use client";

import { useReducedMotion } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useMotionPaused } from "@/components/motion/motion-pause";

export type SelectionTarget = {
  /** Index of the word in the headline (split on spaces). */
  word: number;
  /** Chip under the box, like a layer name in a design tool: kind, then value. */
  label: { kind: string; value: string };
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

/**
 * The selected word's box, relative to the heading. `room` is how far the chip can run to the right of the
 * box's left edge before it leaves the screen.
 */
type Box = { x: number; y: number; width: number; height: number; room: number };

/** The chip is 12 px monospace with 0.04em tracking: under 8 px a character, plus 16 px of padding. */
const chipWidth = (label: SelectionTarget["label"]) => (label.kind.length + 3 + label.value.length) * 8 + 16;

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
  // The chip text changes 60% of the way through each move, while the box is still travelling.
  const [label, setLabel] = useState(targets[0]?.label);
  useEffect(() => {
    if (!target) return;
    const timer = window.setTimeout(() => setLabel(target.label), reduced ? 0 : SELECTION_MOVE_MS * 0.6);
    return () => window.clearTimeout(timer);
  }, [target, reduced]);

  // Advance to the next word on a fixed rhythm. While the visitor has paused animations (the footer's
  // switch) the box rests on the word it is on, and carries on from there afterwards.
  const paused = useMotionPaused();
  useEffect(() => {
    if (reduced || paused || targets.length < 2) return;
    const timer = window.setInterval(() => setStep((s) => s + 1), SELECTION_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduced, paused, targets.length]);

  // Measure the selected word relative to the heading, and again when the layout changes size.
  useEffect(() => {
    const measure = () => {
      const el = target ? wordRefs.current[target.word] : null;
      const root = heading.current;
      if (!el || !root) return;
      const a = el.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      setBox({
        x: a.left - b.left,
        y: a.top - b.top,
        width: a.width,
        height: a.height,
        // 8 px short of the screen's edge; the chip starts 7 px left of the word.
        room: document.documentElement.clientWidth - 8 - (a.left - 7),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (heading.current) observer.observe(heading.current);
    return () => observer.disconnect();
  }, [target]);

  // On a narrow phone a chip that starts at a word near the right edge ("AI" at 360 px) would run off the
  // screen and be cut by the hero. It slides left by what does not fit, on the same curve as the box, so the
  // two travel together.
  const chipShift = box && label ? Math.max(0, chipWidth(label) - box.room) : 0;

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
          {label ? (
            <span
              data-selection-chip=""
              className="absolute bottom-[calc(100%+6px)] left-[-1px] rounded-md bg-violet-300 px-2 py-1 font-mono text-micro leading-none font-semibold tracking-[0.04em] whitespace-nowrap text-ink"
              style={{
                transform: `translateX(${-chipShift}px)`,
                transition: reduced ? undefined : `transform ${SELECTION_MOVE_MS}ms cubic-bezier(0.7, 0, 0.2, 1)`,
              }}
            >
              {label.kind} / {label.value}
            </span>
          ) : null}
        </span>
      ) : null}
    </h1>
  );
}
