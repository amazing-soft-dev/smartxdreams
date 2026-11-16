"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { processSteps } from "@/content/process";
import { cx } from "@/lib/cx";

/**
 * "How we build": four steps. On desktop the section is three viewports tall and its content sticks under
 * the header while the visitor scrolls, so scrolling moves through the steps.
 */
export function ProcessStepper() {
  const section = useRef<HTMLElement>(null);
  // Progress through the tall section, 0 at its top and 1 when its bottom reaches the viewport bottom.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(processSteps.length - 1, Math.floor(p * processSteps.length));
    setActive((current) => (current === next ? current : next));
  });

  return (
    <section
      ref={section}
      id="how-we-build"
      aria-labelledby="how-we-build-title"
      data-nav-theme="light"
      className="relative bg-canvas-200 text-ink lg:h-[300vh]"
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center">
        <Container className="py-20 md:py-28 lg:py-0">
          <SectionHeader
            id="how-we-build-title"
            tag="How we build"
            title="From friction to *a product you trust.*"
            align="left"
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <ol className="relative flex flex-col gap-1">
              {processSteps.map((step, i) => (
                <li
                  key={step.title}
                  aria-current={i === active ? "step" : undefined}
                  className={cx("py-4 transition-opacity duration-500 lg:opacity-55 lg:aria-[current=step]:opacity-100")}
                >
                  <h3 className="text-h5">
                    <span className="mr-3 font-mono text-micro text-ink/60">{String(i + 1).padStart(2, "0")}</span>
                    {step.title}
                  </h3>
                  {/* On desktop only the active step shows its detail; it opens with a height transition. */}
                  <p
                    className={cx(
                      "max-w-md overflow-hidden text-body text-ink/70 transition-[max-height,opacity,margin] duration-700 ease-[var(--ease-out-quint)]",
                      "mt-2 lg:max-h-0 lg:opacity-0 lg:mt-0",
                      i === active && "lg:mt-2 lg:max-h-40 lg:opacity-100",
                    )}
                  >
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[30px] bg-ink lg:block" />
          </div>
        </Container>
      </div>
    </section>
  );
}
