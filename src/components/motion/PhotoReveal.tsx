"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/styles/motion";

/**
 * Brings a filled photo in from a soft blur and a slight zoom (blur 12 px, 108%) to sharp and in place as
 * it scrolls into view, on the same rise spring as the text around it. Wrap a <Photo fill> whose parent
 * clips, so the zoom never spills out of the frame and nothing shifts.
 *
 * Reduced motion and no-JavaScript are handled in CSS (data-motion, data-reveal), because the server writes
 * the starting styles inline before the visitor's setting is known.
 */
export function PhotoReveal({ children }: { children: ReactNode }) {
  return (
    <m.div
      data-motion="photo"
      data-reveal=""
      className="absolute inset-0"
      initial={{ filter: "blur(12px)", scale: 1.08 }}
      whileInView={{ filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={spring.rise}
    >
      {children}
    </m.div>
  );
}
