"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ease } from "@/styles/motion";

type FilterListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
  /** Rendered when no item matches. */
  empty?: ReactNode;
};

/**
 * A grid that animates when a filter changes: remaining items glide to their new place (layout
 * animation), removed items fade out, and new items fade up with a 45 ms stagger. Under reduced motion,
 * MotionProvider limits this to opacity.
 */
export function FilterList<T>({ items, getKey, renderItem, className, empty }: FilterListProps<T>) {
  if (items.length === 0 && empty) return <>{empty}</>;
  return (
    <motion.ul layout className={cx("grid", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item, index) => (
          <motion.li
            key={getKey(item)}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.46, delay: index * 0.045, ease: ease.outQuint }}
          >
            {renderItem(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
