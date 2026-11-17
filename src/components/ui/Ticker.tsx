import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Ticker.module.css";

type TickerProps = {
  /** The items in one loop. They are rendered twice so the track can loop without a gap. */
  items: ReactNode[];
  /** Seconds for one full loop. */
  duration?: number;
  /** Space between items, in px. */
  gap?: number;
  /** Accessible name for the list, e.g. "Job sources". */
  label: string;
  className?: string;
};

/**
 * An endless horizontal marquee, in plain CSS: the item list is duplicated and the track moves by
 * exactly one copy, so the loop is seamless. Edges fade out. It pauses on hover and focus, and stops
 * under reduced motion. The duplicate copy is hidden from screen readers.
 */
export function Ticker({ items, duration = 40, gap = 56, label, className }: TickerProps) {
  const style = { "--ticker-duration": `${duration}s`, "--ticker-gap": `${gap}px` } as CSSProperties;
  return (
    <div className={cx(styles.viewport, className)} style={style}>
      <div className={styles.track}>
        <ul aria-label={label} className={styles.group}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
        <ul aria-hidden="true" className={styles.group}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
