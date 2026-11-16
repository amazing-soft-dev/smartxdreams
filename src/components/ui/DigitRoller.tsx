"use client";

import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
import styles from "./DigitRoller.module.css";

type DigitRollerProps = {
  /** The text to show, e.g. "$199", "12", "99.9%". Digits roll; other characters stay still. */
  value: string;
  className?: string;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number whose digits sit in masked 0-9 columns. Each column is shifted up by its digit, so changing
 * the value rolls every digit to its new place. Digits use tabular figures so the width stays steady.
 */
export function DigitRoller({ value, className }: DigitRollerProps) {
  const chars = Array.from(value);
  return (
    <span className={cx(styles.roller, className)}>
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
            <span className={styles.column} style={{ "--digit": Number(char), "--order": index } as CSSProperties}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
