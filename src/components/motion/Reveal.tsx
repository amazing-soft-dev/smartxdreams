"use client";

import { motion, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/styles/motion";

/**
 * Reveal presets, matching the site's entrance language:
 * - up60: rise 60 px (most text and buttons), spring A
 * - left60 / right60: slide 60 px in from the side (avatars, side notes), spring A
 * - waveDown / waveUp: drop 160 px from above or rise 160 px from below (hero cards), spring B
 * - fade: opacity only
 */
export const revealPresets = {
  up60: { hidden: { opacity: 0, y: 60 }, transition: spring.a },
  left60: { hidden: { opacity: 0, x: -60 }, transition: spring.a },
  right60: { hidden: { opacity: 0, x: 60 }, transition: spring.a },
  waveDown: { hidden: { opacity: 0, y: -160 }, transition: spring.b },
  waveUp: { hidden: { opacity: 0, y: 160 }, transition: spring.b },
  fade: { hidden: { opacity: 0 }, transition: { duration: 0.6 } },
} as const satisfies Record<string, { hidden: TargetAndTransition; transition: object }>;

export type RevealPreset = keyof typeof revealPresets;

const visible: TargetAndTransition = { opacity: 1, x: 0, y: 0 };

type RevealProps = {
  children: ReactNode;
  preset?: RevealPreset;
  /** Seconds before the animation starts. */
  delay?: number;
  /** Share of the element that must be in view before it reveals. */
  amount?: number;
  className?: string;
};

/** Reveals its children once, when they scroll into view. */
export function Reveal({ children, preset = "up60", delay = 0, amount = 0.2, className }: RevealProps) {
  const { hidden, transition } = revealPresets[preset];
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount }}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}
