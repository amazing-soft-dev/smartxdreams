"use client";

import { useInView, useReducedMotion } from "motion/react";
import { type CSSProperties, useRef } from "react";
import { cx } from "@/lib/cx";
import styles from "./DigitRoller.module.css";

type DigitRollerProps = {
  /** The text to show, e.g. "$199", "12", "99.9%". Digits roll; other characters stay still. */
  value: string;
  className?: string;
  /** Roll up from zero when first scrolled into view (counters). Off for values that change on toggle. */
  countUp?: boolean;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number whose digits sit in masked 0-9 columns. Each column is shifted up by its digit, so changing
 * the value rolls every digit to its new place. Digits use tabular figures so the width stays steady.
 */
export function DigitRoller({ value, className, countUp = true }: DigitRollerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();
  // Until the number is on screen every digit waits at 0; reduced motion shows the value at once.
  const settled = !countUp || inView || reduced === true;
  const chars = Array.from(value);
  return (
    <span ref={ref} className={cx(styles.roller, className)}>
      {/* Screen readers get the real value once; the animated columns are hidden from them. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className={styles.roller}>
      {chars.map((char, index) => {
        // Keyed from the right, so "$49" -> "$470" keeps the existing digits and adds one on the left.
        const key = chars.length - index;
        if (!DIGITS.includes(char)) {
          return (
            <span key={`s${key}`} className={styles.static}>
              {char}
            </span>
          );
        }
        return (
          <span key={`d${key}`} className={styles.slot}>
            <span className={styles.column} style={{ "--digit": settled ? Number(char) : 0, "--order": index } as CSSProperties}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
      </span>
    </span>
  );
}
