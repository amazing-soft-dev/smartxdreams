"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * reducedMotion="user": when the visitor asks for reduced motion, Motion skips transform and layout
 * animations (no slides, drops or springs) and keeps only short opacity fades.
 *
 * LazyMotion gives the `m` components their features: domAnimation is animation, exit, in-view, hover, tap
 * and focus, without drag or layout animation, which most pages never use. It is passed in directly, not
 * loaded later, so content that starts hidden appears exactly when it did with `motion` components. A
 * component that animates layout brings its own features (see FilterList). Use `m`, not `motion`, inside
 * it: one `motion` import puts every feature back in the shared chunk.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}
