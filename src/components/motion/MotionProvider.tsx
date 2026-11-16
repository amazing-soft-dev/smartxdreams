"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * reducedMotion="user": when the visitor asks for reduced motion, Motion skips transform and layout
 * animations (no slides, drops or springs) and keeps only short opacity fades.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
