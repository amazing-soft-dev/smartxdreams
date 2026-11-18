"use client";

import { motion, type Variants } from "motion/react";
import { Fragment } from "react";

/** Seconds between words. */
export const WORD_STAGGER = 0.045;

/**
 * One word's sharpening: from opacity 0.15 and blur(6px) to clear in 0.5 s. Only opacity and filter change,
 * so nothing shifts while the words come in.
 */
export const wordVariants: Variants = {
  hidden: { opacity: 0.15, filter: "blur(6px)" },
  visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5 } },
};

/** The container's stagger: each word starts WORD_STAGGER after the one before. */
export const wordContainerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: WORD_STAGGER } } };

type WordRevealProps = {
  text: string;
  as?: "p" | "span" | "div";
  className?: string;
  /** Share of the text in view before it starts. */
  amount?: number;
};

/**
 * Text that sharpens word by word as it scrolls into view: Ignivo's text effect, which the home statement
 * introduced. The whole sentence is in the DOM from the start, so screen readers and visitors without
 * JavaScript read it normally; under reduced motion the words are clear from the first paint (data-motion).
 */
export function WordReveal({ text, as = "p", className, amount = 0.4 }: WordRevealProps) {
  const Component = motion[as];
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={wordContainerVariants}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span data-reveal="" data-motion="word" className="inline-block" variants={wordVariants}>
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Component>
  );
}
