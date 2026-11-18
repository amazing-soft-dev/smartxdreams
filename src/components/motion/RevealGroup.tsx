"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { revealPresets, type RevealPreset } from "./Reveal";

/** Attributes passed through to the rendered element: an accessible name, data-* hooks for tests. */
type PassThrough = { "aria-label"?: string } & { [key: `data-${string}`]: string | undefined };

type RevealGroupProps = PassThrough & {
  children: ReactNode;
  /** Seconds between each child's start. */
  stagger?: number;
  /** Seconds before the first child starts. */
  delay?: number;
  amount?: number;
  className?: string;
  /** Render as a list (ul) when the children are RevealItem as="li". */
  as?: "div" | "ul" | "ol";
};

const groupVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/**
 * Staggers its RevealItem children: when the group scrolls into view, each item reveals a little
 * after the one before (cards in a grid, list rows).
 */
export function RevealGroup({ children, stagger = 0.08, delay = 0, amount = 0.15, className, as = "div", ...rest }: RevealGroupProps) {
  const Component = motion[as];
  return (
    <Component
      {...rest}
      className={className}
      variants={groupVariants(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Component>
  );
}

type RevealItemProps = PassThrough & {
  children: ReactNode;
  preset?: RevealPreset;
  className?: string;
  as?: "div" | "li" | "article";
};

/** One staggered child of a RevealGroup. */
export function RevealItem({ children, preset = "up60", className, as = "div", ...rest }: RevealItemProps) {
  const { hidden, transition } = revealPresets[preset];
  const variants: Variants = { hidden, visible: { opacity: 1, x: 0, y: 0, transition } };
  const Component = motion[as];
  return (
    <Component {...rest} data-reveal="" className={className} variants={variants}>
      {children}
    </Component>
  );
}
