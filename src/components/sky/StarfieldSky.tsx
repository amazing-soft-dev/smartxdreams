import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
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
 * (#070117) that twinkle and gently swell and shrink. Place it inside a positioned container; it fills it.
 * Decorative: hidden from assistive technology and never takes the pointer.
 */
export function StarfieldSky({ className }: { className?: string }) {
  return (
    <div
      data-starfield-sky=""
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 overflow-hidden bg-space", className)}
      style={ROOT_STYLE}
    >
      <svg className={styles.svg} width="100%" height="100%" focusable="false">
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
      </svg>
    </div>
  );
}
