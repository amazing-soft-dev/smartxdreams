"use client";

import { m, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";
import { ease, spring } from "@/styles/motion";

/**
 * Reveal presets, matching the site's entrance language:
 * - up60: rise 60 px (most text and buttons), spring A
 * - left60 / right60: slide 60 px in from the side (avatars, side notes), spring A
 * - waveDown / waveUp: drop 160 px from above or rise 160 px from below (hero cards), spring B
 * - fade: opacity only
 * - up35 / up50 / up75 / up100 / up150: Beemas' block fade-ups from each distance it uses, all on its
 *   measured rise spring (docs/motion-audit.md)
 * - left200 / right200: Beemas' side slides from 200 px, on its quicker slide spring
 * - drop75: a drop from 75 px above, on the rise spring (Beemas' centred badges and notes)
 * - blur10: Ignivo's fade from blur(10px), the effect of the home statement's words
 */
export const revealPresets = {
  up60: { hidden: { opacity: 0, y: 60 }, transition: spring.a },
  left60: { hidden: { opacity: 0, x: -60 }, transition: spring.a },
  right60: { hidden: { opacity: 0, x: 60 }, transition: spring.a },
  waveDown: { hidden: { opacity: 0, y: -160 }, transition: spring.b },
  waveUp: { hidden: { opacity: 0, y: 160 }, transition: spring.b },
  fade: { hidden: { opacity: 0 }, transition: { duration: 0.6 } },
  up35: { hidden: { opacity: 0, y: 35 }, transition: spring.rise },
  up50: { hidden: { opacity: 0, y: 50 }, transition: spring.rise },
  up75: { hidden: { opacity: 0, y: 75 }, transition: spring.rise },
  up100: { hidden: { opacity: 0, y: 100 }, transition: spring.rise },
  up150: { hidden: { opacity: 0, y: 150 }, transition: spring.rise },
  left200: { hidden: { opacity: 0, x: -200 }, transition: spring.slide },
  right200: { hidden: { opacity: 0, x: 200 }, transition: spring.slide },
  drop75: { hidden: { opacity: 0, y: -75 }, transition: spring.rise },
  blur10: { hidden: { opacity: 0, filter: "blur(10px)" }, transition: { duration: 0.6, ease: ease.outQuint } },
} as const satisfies Record<string, { hidden: TargetAndTransition; transition: object }>;

export type RevealPreset = keyof typeof revealPresets;

/** Where every preset ends: in place, opaque, and unblurred if it started blurred. */
export function restingState(hidden: TargetAndTransition): TargetAndTransition {
  return { opacity: 1, x: 0, y: 0, ...("filter" in hidden ? { filter: "blur(0px)" } : {}) };
}

type RevealProps = {
  children: ReactNode;
  preset?: RevealPreset;
  /** Seconds before the animation starts. */
  delay?: number;
  /** Share of the element that must be in view before it reveals. */
  amount?: number;
  className?: string;
  /**
   * Above the fold: animate on mount instead of on scroll, starting from opacity 0.001 rather than 0.
   * Browsers ignore fully transparent elements when measuring Largest Contentful Paint, so a hero that
   * starts at 0 would delay LCP until its animation ends.
   */
  aboveFold?: boolean;
};

/** Reveals its children once, when they scroll into view (or on mount when aboveFold is set). */
export function Reveal({ children, preset = "up60", delay = 0, amount = 0.2, className, aboveFold = false }: RevealProps) {
  const { hidden, transition } = revealPresets[preset];
  const visible = restingState(hidden);
  if (aboveFold) {
    return (
      <m.div
        data-reveal=""
        className={className}
        initial={{ ...hidden, opacity: 0.001 }}
        animate={visible}
        transition={{ ...transition, delay }}
      >
        {children}
      </m.div>
    );
  }
  return (
    <m.div
      data-reveal=""
      className={className}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount }}
      transition={{ ...transition, delay }}
    >
      {children}
    </m.div>
  );
}
