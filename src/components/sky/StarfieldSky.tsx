"use client";

import { type CSSProperties, useEffect, useId, useRef } from "react";
import { cx } from "@/lib/cx";
import { createShootingStarLoop, SHOOTING_STAR } from "./shooting-stars";
import { createStars, DEPTH_LAYERS, PULSE_PERIOD_MS, pulseDelayMs, type Star } from "./stars";
import styles from "./StarfieldSky.module.css";

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
 * Place it inside a positioned container; it fills it. Decorative: hidden from assistive technology and never
 * takes the pointer.
 */
export function StarfieldSky({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shootingRef = useRef<SVGGElement>(null);
  const blurId = `sky-blur-${useId().replace(/[^\w-]/g, "")}`;

  // Shooting stars: one rAF loop that runs only while the sky is on screen and the tab is visible. The same
  // check pauses the CSS twinkle and pulse.
  useEffect(() => {
    const root = rootRef.current;
    const layer = shootingRef.current;
    if (!root || !layer) return;
    const loop = createShootingStarLoop(layer, { filter: `url(#${blurId})` });
    let onScreen = false;
    const sync = () => {
      const run = onScreen && document.visibilityState === "visible";
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
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      loop.dispose();
      root.removeAttribute("data-paused");
    };
  }, [blurId]);

  return (
    <div
      ref={rootRef}
      data-starfield-sky=""
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 overflow-hidden bg-space", className)}
      style={ROOT_STYLE}
    >
      <svg className={styles.svg} width="100%" height="100%" focusable="false">
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
