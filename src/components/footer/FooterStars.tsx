import type { CSSProperties } from "react";
import { buildStarShadows, STAR_LAYERS, STAR_TILE } from "./footer-stars";
import styles from "./FooterStars.module.css";

/** Built once at module load: the same shadows on the server and the client. */
const LAYERS = STAR_LAYERS.map((layer) => ({
  ...layer,
  style: {
    width: `${layer.size}px`,
    height: `${layer.size}px`,
    boxShadow: buildStarShadows(layer),
    "--star-duration": `${layer.duration}s`,
  } as CSSProperties,
}));

const SKY_STYLE = { "--star-tile-height": `${STAR_TILE.height}px` } as CSSProperties;

/**
 * The footer's night sky: three depth layers of round, seeded stars drifting slowly upward, the far small
 * stars fastest (after StarfieldFX). Pure CSS, so it costs no JavaScript and still drifts where WebGL can't
 * run. Reduced motion gets a still sky. Decorative: hidden from assistive technology, never takes the pointer.
 */
export function FooterStars() {
  return (
    <div aria-hidden="true" className={styles.sky} style={SKY_STYLE} data-footer-stars="">
      {LAYERS.map((layer) => (
        <div key={layer.seed} className={styles.layer} style={layer.style} />
      ))}
    </div>
  );
}
