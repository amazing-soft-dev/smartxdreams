"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ease } from "@/styles/motion";

/**
 * Brings a portrait in the way Beemas brings in its testimonial portraits: from greyscale and a slight tilt
 * (alternately -8 and 8 degrees) to full colour and level, as it scrolls into view. The image is scaled up
 * while it is tilted so its corners never show inside the rounded frame. Reduced motion shows it as is.
 */
export function PortraitReveal({ children, index }: { children: ReactNode; index: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className="absolute inset-0">{children}</div>;
  const tilt = index % 2 === 0 ? -8 : 8;
  return (
    <motion.div
      data-motion="portrait"
      className="absolute inset-0"
      initial={{ filter: "saturate(0)", rotate: tilt, scale: 1.22 }}
      whileInView={{ filter: "saturate(1)", rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 1.1, ease: ease.outQuint }}
    >
      {children}
    </motion.div>
  );
}
