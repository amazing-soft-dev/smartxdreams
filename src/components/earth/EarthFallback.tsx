import { cx } from "@/lib/cx";
import styles from "./EarthFallback.module.css";
import { GLOW_BAND, horizonPath, PLATE, PLATE_VARIANTS } from "./plate";
import { plateLayoutCss } from "./plate-layout";

/** The plate's placement per breakpoint, plateRect() in CSS: the same numbers the WebGL scene uses. */
const LAYOUT_CSS = plateLayoutCss("[data-earth-fallback]");

/** The 1200 px variant: sharp enough for a still backdrop on most screens, a quarter of the master's bytes. */
export const FALLBACK_PLATE = PLATE_VARIANTS[1];

/** The planet's outline, and the same outline lifted by the glow band, in plate pixels. */
const PLANET = horizonPath();
const GLOW = horizonPath(32, GLOW_BAND);
const VIEW_BOX = `0 0 ${PLATE.width} ${PLATE.height}`;

/**
 * The Earth backdrop without WebGL: the painted plate placed exactly as the scene places it, cut to the planet's oval, with its painted atmosphere glow kept just outside the limb. It is
 * painted with the page, so the hero is never empty, and it is all that shows for reduced motion, data saver,
 * low-power devices and missing WebGL 2. Decorative.
 *
 * The glow is the plate drawn again in a soft band above the limb with `screen` blending: the painted sky is
 * black, so it adds nothing, and the glow lightens the sky behind it, as the scene's brightness-as-coverage
 * does.
 */
export function EarthFallback({ className }: { className?: string }) {
  return (
    <div data-earth-fallback="" aria-hidden="true" className={cx(styles.root, className)}>
      <style>{LAYOUT_CSS}</style>
      <svg className={cx(styles.plate, styles.glow)} viewBox={VIEW_BOX} preserveAspectRatio="none" focusable="false">
        <defs>
          <filter id="earth-fallback-soft" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <mask id="earth-fallback-glow" maskUnits="userSpaceOnUse" x="0" y="0" width={PLATE.width} height={PLATE.height}>
            <path d={GLOW} fill="#fff" filter="url(#earth-fallback-soft)" />
          </mask>
        </defs>
        <image href={FALLBACK_PLATE.src} width={PLATE.width} height={PLATE.height} mask="url(#earth-fallback-glow)" />
      </svg>
      <svg className={styles.plate} viewBox={VIEW_BOX} preserveAspectRatio="none" focusable="false">
        <defs>
          <clipPath id="earth-fallback-planet">
            <path d={PLANET} />
          </clipPath>
        </defs>
        <image href={FALLBACK_PLATE.src} width={PLATE.width} height={PLATE.height} clipPath="url(#earth-fallback-planet)" />
      </svg>
    </div>
  );
}
