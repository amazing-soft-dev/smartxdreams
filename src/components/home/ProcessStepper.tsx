"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PhotoImage, type PhotoImageData } from "@/components/ui/PhotoImage";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { processSteps } from "@/content/process";
import { cx } from "@/lib/cx";

/** The tick bar fills the content row: one tick every 7 px (2 px tick, 5 px gap), as many as fit. */
const TICK_PITCH = 7;
/**
 * Width of the wave as a share of the row: the Gaussian's sigma. Three ticks of the original 40-tick bar
 * (3 / 39), so the bump covers the same stretch of the line however many ticks fill it.
 */
const WAVE_SIGMA = 3 / 39;
/** Ticks drawn before the row is measured (the server render, and the first frame). */
const TICKS_BEFORE_MEASURE = 40;

/**
 * Each step's photo, by registry slot. The page looks them up on the server and passes them in: this is a
 * client component, and importing the registry here would send every photo's entry to the browser.
 */
export type ProcessPhotos = Record<(typeof processSteps)[number]["slot"], PhotoImageData>;

/**
 * "How we build": four steps. On desktop the section is three viewports tall and its content sticks under
 * the header while the visitor scrolls, so scrolling moves through the steps.
 */
export function ProcessStepper({ photos }: { photos: ProcessPhotos }) {
  const section = useRef<HTMLElement>(null);
  // Scroll scrubbing is a desktop enhancement. With reduced motion the section is a plain stacked list at
  // every width: all steps open, each with its photo, nothing sticky. That switch is made in CSS (the
  // motion-safe: variants), not by rendering differently: useReducedMotion() is null on the server, so a
  // rendered branch would not match on hydration, React would rebuild the page and the scroll would jump.
  // Progress through the tall section, 0 at its top and 1 when its bottom reaches the viewport bottom.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // The rail follows progress through a spring, which smooths wheel steps into a continuous fill.
  const rail = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const [active, setActive] = useState(0);
  // Tick bar: each tick is 8 px tall plus a Gaussian bump (up to 22 px) centred on the current progress,
  // so a wave travels along the bar as you scroll. The bump's width is a share of the row (WAVE_SIGMA), not a
  // number of ticks, so it keeps its shape from 1024 px to 1920 px. Heights are written directly to the DOM, not to state,
  // so scrolling does not re-render the section 60 times a second.
  const ticks = useRef<Array<HTMLSpanElement | null>>([]);
  // How many ticks fit between the row's left edge and the step counter, measured as the row resizes.
  const track = useRef<HTMLDivElement>(null);
  const [tickCount, setTickCount] = useState(TICKS_BEFORE_MEASURE);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setTickCount(Math.max(2, Math.floor((el.clientWidth + TICK_PITCH - 2) / TICK_PITCH)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const paint = (p: number) => {
    const count = ticks.current.length;
    const centre = p * (count - 1);
    const sigma = Math.max(1, WAVE_SIGMA * (count - 1));
    ticks.current.forEach((tick, i) => {
      if (!tick) return;
      const d = i - centre;
      tick.style.height = `${8 + 22 * Math.exp(-(d * d) / (2 * sigma * sigma))}px`;
      tick.style.backgroundColor = i <= centre ? "var(--color-coral-500)" : "rgb(15 18 38 / 0.18)";
    });
  };
  useMotionValueEvent(scrollYProgress, "change", paint);
  // A new tick count redraws the wave where the visitor already is.
  useEffect(() => {
    ticks.current.length = tickCount;
    paint(scrollYProgress.get());
  }, [tickCount, scrollYProgress]);
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
      className="relative bg-canvas-200 text-ink motion-safe:lg:h-[300vh]"
    >
      <div className="motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:flex motion-safe:lg:h-svh motion-safe:lg:items-center">
        <Container className="py-20 md:py-28 motion-safe:lg:py-0">
          <SectionHeader
            id="how-we-build-title"
            tag="How we build"
            title="From friction to *a product you trust.*"
            align="left"
          />
          {/* Tick bar and step counter (desktop, decorative). */}
          <div aria-hidden="true" data-motion="ticks" className="mt-10 hidden h-8 items-end gap-6 motion-safe:lg:flex">
            {/* The ticks run the whole row, from the content's left edge up to the counter. */}
            <div ref={track} className="flex h-full min-w-0 flex-1 items-end justify-between">
              {Array.from({ length: tickCount }, (_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    ticks.current[i] = el;
                  }}
                  className="block h-2 w-[2px] shrink-0 rounded-full bg-ink/20"
                />
              ))}
            </div>
            <span className="shrink-0 font-mono text-micro tracking-[0.06em] text-ink">
              {String(active + 1).padStart(2, "0")} / {String(processSteps.length).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-12 grid gap-10 motion-safe:lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] motion-safe:lg:gap-16">
            <ol className="relative flex flex-col gap-1 motion-safe:lg:pl-8">
              {/* Coral progress rail (desktop): a faint track with a fill that grows from the top. */}
              <span aria-hidden="true" className="absolute top-0 bottom-0 left-0 hidden w-[1.5px] rounded-full bg-ink/10 motion-safe:lg:block">
                <motion.span className="block h-full w-full origin-top rounded-full bg-coral-500" style={{ scaleY: rail }} />
              </span>
              {processSteps.map((step, i) => (
                <li
                  key={step.title}
                  aria-current={i === active ? "step" : undefined}
                  className="py-4 transition-opacity duration-500 motion-safe:lg:opacity-65 motion-safe:lg:aria-[current=step]:opacity-100"
                >
                  <h3 className="text-h5">
                    <span className="mr-3 font-mono text-micro text-ink">{String(i + 1).padStart(2, "0")}</span>
                    {step.title}
                  </h3>
                  {/* On desktop only the active step shows its detail (opacity only, no height change). */}
                  <p
                    className={cx(
                      "mt-2 max-w-md text-body text-ink/70 transition-opacity duration-700 ease-[var(--ease-out-quint)]",
                      // Inactive details fade out but keep their space, so scrolling never moves the steps.
                      "motion-safe:lg:opacity-0",
                      i === active && "motion-safe:lg:opacity-100",
                    )}
                  >
                    {step.body}
                  </p>
                  {/* Stacked layout (phones, tablets, and reduced motion): each step shows its own photo. */}
                  <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-[22px] motion-safe:lg:hidden">
                    <PhotoImage photo={photos[step.slot]} fill sizes="(min-width: 810px) 80vw, 100vw" />
                  </div>
                </li>
              ))}
            </ol>
            {/* Media panel (desktop): the photos are stacked, and each one is revealed by a circle that grows from
                the left edge when its step becomes active, settling from a slight zoom and blur. Decorative. */}
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[30px] bg-ink motion-safe:lg:block">
              {processSteps.map((step, i) => (
                <div
                  key={step.slot}
                  className="absolute inset-0 transition-[clip-path,scale,filter] duration-[1100ms] ease-[var(--ease-out-quint)]"
                  style={{
                    clipPath: i <= active ? "circle(150% at 0% 50%)" : "circle(0% at 0% 50%)",
                    scale: i === active ? "1" : i < active ? "1" : "1.12",
                    filter: i <= active ? "blur(0px)" : "blur(6px)",
                  }}
                >
                  <PhotoImage photo={photos[step.slot]} fill sizes="(min-width: 1024px) 50vw, 100vw" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
