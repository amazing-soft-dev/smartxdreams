"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { Section } from "@/components/ui/Section";
import { homeStatement } from "@/content/home";
import { productBySlug } from "@/content/selectors";

type Token = { kind: "word"; text: string } | { kind: "chip"; slug: string };

/** Splits each line into words and product chips ("{chip:slug}"). */
function tokenize(line: string): Token[] {
  return line.split(" ").map((part) => {
    const chip = part.match(/^\{chip:([a-z0-9-]+)\}$/);
    return chip?.[1] ? { kind: "chip", slug: chip[1] } : { kind: "word", text: part };
  });
}

const lines = homeStatement.map(tokenize);
/** Seconds between words. */
const STAGGER = 0.045;

/**
 * The statement: four lines that sharpen word by word as they scroll into view (opacity 0.15 to 1 and blur
 * 6 px to 0). Only opacity and filter change, so nothing shifts. The full sentence is in the DOM from the
 * start, so screen readers and visitors without JavaScript read it normally. Product chips pop in at their
 * place in the sentence, and a violet caret blinks after the last word.
 */
export function Statement() {
  return (
    <Section labelledBy="statement-title" surface="canvas" className="py-24 md:py-32">
      <h2 id="statement-title" className="sr-only">
        What we build
      </h2>
      <motion.p
        className="mx-auto max-w-4xl text-center text-h3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: STAGGER }}
      >
        {lines.map((tokens, li) => (
          <Fragment key={li}>
            {tokens.map((token, ti) => {
              if (token.kind === "chip") {
                const product = productBySlug(token.slug);
                return product ? (
                  <Fragment key={ti}>
                    {/* Product chip: pops in with a small overshoot when its turn comes. */}
                    <motion.span
                      data-reveal=""
                      className="mx-0.5 inline-flex translate-y-[-0.12em] items-center gap-1.5 rounded-full bg-white px-3 py-1 align-middle text-label font-medium text-ink shadow-tag"
                      variants={{
                        hidden: { opacity: 0, scale: 0.4 },
                        visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.45, duration: 0.5 } },
                      }}
                    >
                      <span aria-hidden="true" className="size-2 rounded-full bg-coral-500" />
                      {product.name}
                    </motion.span>{" "}
                  </Fragment>
                ) : null;
              }
              return (
                <Fragment key={`${li}-${ti}`}>
                  <motion.span
                    data-reveal=""
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0.15, filter: "blur(6px)" },
                      visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5 } },
                    }}
                  >
                    {token.text}
                  </motion.span>{" "}
                </Fragment>
              );
            })}
            {li < lines.length - 1 ? <br className="hidden md:inline" /> : null}
          </Fragment>
        ))}
        {/* Caret after the last word: appears with it, then blinks. Decorative. */}
        <motion.span
          aria-hidden="true"
          className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] animate-[caret-blink_1s_step-end_infinite] rounded-full bg-violet-500"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        />
      </motion.p>
    </Section>
  );
}
