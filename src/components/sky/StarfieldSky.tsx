"use client";

import { useReducedMotion } from "motion/react";
import { type CSSProperties, useEffect, useId, useRef } from "react";
import { cx } from "@/lib/cx";
import { createShootingStarLoop, SHOOTING_STAR } from "./shooting-stars";
import { parallaxOffset, scrollProgress, visibleStarCount } from "./scroll";
import { createStars, DEPTH_LAYERS, layerDepth, PULSE_PERIOD_MS, pulseDelayMs, type Star } from "./stars";
import styles from "./StarfieldSky.module.css";
import { isMotionPaused, subscribeMotionPaused } from "@/components/motion/motion-pause";

/** The seeded sky, built once at module load: the same stars on the server and the client. */
const STARS = createStars();
/** Stars grouped by depth layer, far first, so each layer can move as one group. */
const LAYERS: Star[][] = Array.from({ length: DEPTH_LAYERS }, (_, layer) =>
  STARS.filter((star) => star.layer === layer),
);

const ROOT_STYLE = { "--sky-pulse-period": `${PULSE_PERIOD_MS}ms` } as CSSProperties;

/**
 * The night sky around the planet, after the Framer "Starfield" component: 200 seeded stars on `space`
 * (#070117) that twinkle and gently swell and shrink, now and then a shooting star, and a faint violet haze.
 * Far stars drift with the page scroll and the sky thins toward the bottom of the page. Reduced motion gets a
 * still sky. Place it inside a positioned container; it fills it. Decorative: hidden from assistive technology
 * and never takes the pointer.
 */
export function StarfieldSky({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shootingRef = useRef<SVGGElement>(null);
  const blurId = `sky-blur-${useId().replace(/[^\w-]/g, "")}`;
  // Reduced motion: a still sky. No shooting stars or scroll response here; the CSS stops twinkle and pulse.
  const reduced = useReducedMotion();

  // Shooting stars: one rAF loop that runs only while the sky is on screen, the tab is visible and the
  // visitor has not paused animations (the footer's switch). The same check pauses the CSS twinkle and pulse.
  useEffect(() => {
    const root = rootRef.current;
    const layer = shootingRef.current;
    if (reduced || !root || !layer) return;
    const loop = createShootingStarLoop(layer, { filter: `url(#${blurId})` });
    let onScreen = false;
    const sync = () => {
      const run = onScreen && document.visibilityState === "visible" && !isMotionPaused();
      root.toggleAttribute("data-paused", !run);
      if (run) loop.start();
      else loop.stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      sync();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    const unsubscribe = subscribeMotionPaused(sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      unsubscribe();
      loop.dispose();
      root.removeAttribute("data-paused");
    };
  }, [blurId, reduced]);

  // Scroll: each depth layer drifts down by its parallax offset, and the sky thins from all its stars at the
  // top of the page to 40 % at the bottom. A passive listener schedules at most one update per frame.
  useEffect(() => {
    const svg = svgRef.current;
    if (reduced || !svg) return;
    const layers = Array.from(svg.querySelectorAll<SVGGElement>("[data-sky-layer]"));
    const stars: SVGCircleElement[] = [];
    for (const circle of svg.querySelectorAll<SVGCircleElement>("[data-star]")) {
      stars[Number(circle.dataset.star)] = circle;
    }
    let height = svg.getBoundingClientRect().height;
    let shown = stars.length;
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      for (const g of layers) {
        const offset = (parallaxOffset(scrollY, layerDepth(Number(g.dataset.skyLayer))) / 100) * height;
        g.setAttribute("transform", `translate(0 ${offset.toFixed(2)})`);
      }
      const progress = scrollProgress(scrollY, document.documentElement.scrollHeight, window.innerHeight);
      const count = visibleStarCount(stars.length, progress);
      for (let i = Math.min(count, shown); i < Math.max(count, shown); i++) {
        stars[i]!.style.display = i < count ? "" : "none";
      }
      shown = count;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(() => {
      height = svg.getBoundingClientRect().height;
      schedule();
    });

    update();
    resize.observe(svg);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      for (const g of layers) g.removeAttribute("transform");
      for (const star of stars) star.style.display = "";
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      data-starfield-sky=""
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 overflow-hidden bg-space", className)}
      style={ROOT_STYLE}
    >
      <svg ref={svgRef} className={styles.svg} width="100%" height="100%" focusable="false">
        <defs>
          {/* blur(0.5px) for the shooting stars, over the whole sky so thin, flat trails are never clipped. */}
          <filter id={blurId} filterUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={SHOOTING_STAR.blur} />
          </filter>
        </defs>
        {LAYERS.map((stars, layer) => (
          <g key={layer} data-sky-layer={layer}>
            {stars.map((star) => (
              <circle
                key={star.i}
                data-star={star.i}
                className={styles.star}
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size}
                fill={star.color}
                fillOpacity={1}
                style={{ animationDelay: `${star.delay}s, ${pulseDelayMs(star.i)}ms` }}
              />
            ))}
          </g>
        ))}
        <g ref={shootingRef} data-sky-shooting-stars="" />
      </svg>
      <div className={styles.atmosphere} />
    </div>
  );
}
