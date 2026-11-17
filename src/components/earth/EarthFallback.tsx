import { preload } from "react-dom";
import { StarfieldSky } from "@/components/sky/StarfieldSky";
import { cx } from "@/lib/cx";
import styles from "./EarthFallback.module.css";
import { GLOW_BAND, horizonPath, PLATE, PLATE_SRCSET, PLATE_VARIANTS } from "./plate";
import { plateLayoutCss } from "./plate-layout";

/**
 * Roughly how wide the plate is drawn at each breakpoint (it is wider than the viewport, since it reaches past
 * the hero's left edge). The browser picks a variant from this the way EarthScene's pickPlateVariant() does,
 * so the scene usually reuses the file the fallback already loaded.
 */
export const PLATE_SIZES = "(min-width: 1024px) 110vw, (min-width: 640px) 175vw, 190vw";

/** An SVG mask as a data URL: `body` drawn white over the plate's pixel box, stretched to the element. */
function svgMask(body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLATE.width} ${PLATE.height}" preserveAspectRatio="none">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * The plate's placement per breakpoint (plateRect() in CSS, the same numbers the scene uses) and the two masks:
 * the planet's outline, and a soft band reaching GLOW_BAND above the limb for the painted glow.
 */
const LAYOUT_CSS =
  plateLayoutCss("[data-earth-fallback]") +
  `[data-earth-fallback]{--plate-planet-mask:${svgMask(`<path d="${horizonPath()}" fill="#fff"/>`)};` +
  `--plate-glow-mask:${svgMask(
    `<filter id="soft" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>` +
      `<path d="${horizonPath(32, GLOW_BAND)}" fill="#fff" filter="url(#soft)"/>`,
  )}}`;

/** The variant before the browser has chosen one (and for browsers without srcset). */
const DEFAULT_PLATE = PLATE_VARIANTS[1];

/**
 * The Earth backdrop without WebGL: the starfield sky, and over it the painted plate placed exactly as the
 * scene places it, cut to the planet's oval, with its painted atmosphere glow kept just outside the limb. It
 * is painted with the page, so the hero is never empty, and it is all that shows for reduced motion, data
 * saver, low-power devices and missing WebGL 2. The scene draws over it and is transparent outside the planet,
 * so the sky here is the sky in both cases. Decorative.
 *
 * The glow is the plate drawn again through a soft band above the limb with `screen` blending: the painted sky
 * is black, so it adds nothing, and the glow lightens the sky behind it, as the scene's brightness-as-coverage
 * does. Both images use the same srcset and sizes, so they share one download.
 */
export function EarthFallback({ className }: { className?: string }) {
  // Start the plate early, in the variant the browser will pick from the srcset.
  preload(DEFAULT_PLATE.src, { as: "image", imageSrcSet: PLATE_SRCSET, imageSizes: PLATE_SIZES, fetchPriority: "high" });
  return (
    <div data-earth-fallback="" aria-hidden="true" className={cx(styles.root, className)}>
      <style>{LAYOUT_CSS}</style>
      <StarfieldSky />
      {/* eslint-disable-next-line @next/next/no-img-element -- a masked, blended layer; next/image adds nothing here. */}
      <img
        src={DEFAULT_PLATE.src}
        srcSet={PLATE_SRCSET}
        sizes={PLATE_SIZES}
        alt=""
        decoding="async"
        className={cx(styles.plate, styles.glow)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- as above. */}
      <img
        src={DEFAULT_PLATE.src}
        srcSet={PLATE_SRCSET}
        sizes={PLATE_SIZES}
        alt=""
        decoding="async"
        fetchPriority="high"
        className={cx(styles.plate, styles.planet)}
      />
    </div>
  );
}
