import { cx } from "@/lib/cx";
import styles from "./EarthFallback.module.css";
import { earthLayoutCss } from "./layout";

/** Per-breakpoint planet and sunrise geometry, the same numbers the WebGL scene uses. Built at module load. */
const LAYOUT_CSS = earthLayoutCss("[data-earth-fallback]");

/**
 * The Earth backdrop in pure CSS: ink sky, an ocean-blue planet with the same circle as the WebGL scene, its
 * violet atmosphere and the coral sunrise on the limb. It is painted with the page, so the hero is never
 * empty, and it is all that shows for reduced motion, data saver, low-power devices and missing WebGL 2.
 * Decorative.
 */
export function EarthFallback({ className }: { className?: string }) {
  return (
    <div data-earth-fallback="" aria-hidden="true" className={cx(styles.root, className)}>
      <style>{LAYOUT_CSS}</style>
      <div className={styles.planet} />
      <div className={styles.flare} />
    </div>
  );
}
