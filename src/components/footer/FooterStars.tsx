"use client";

import type { CSSProperties } from "react";
import { buildStarShadows, STAR_LAYERS, STAR_TILE } from "./footer-stars";
import styles from "./FooterStars.module.css";

/** Built once at module load, from fixed seeds: the same shadows on the server and in the browser. */
const LAYERS = STAR_LAYERS.map((layer) => ({
  ...layer,
  style: {
    width: `${layer.size}px`,
    height: `${layer.size}px`,
    boxShadow: buildStarShadows(layer),
    "--star-duration": `${layer.duration}s`,
    "--star-parallax": `${layer.parallax}px`,
  } as CSSProperties,
}));

const SKY_STYLE = { "--star-tile-height": `${STAR_TILE.height}px` } as CSSProperties;

/**
 * The footer's night sky: three depth layers of round, seeded stars drifting slowly upward, the far small
 * stars fastest (after StarfieldFX). The stars are in the server-rendered markup and move in CSS alone, so
 * the sky shows and drifts without JavaScript, and where WebGL can't run. With a mouse, the layers also shift
 * a few pixels against the cursor, near ones most, from the --pointer-x / --pointer-y the aurora writes on
 * this element. Reduced motion gets a still sky. Decorative: hidden from assistive technology, never takes
 * the pointer.
 *
 * A client component for the page's weight only. What a server component renders is sent twice, as markup
 * and again in the React payload, and the three box-shadow lists are long. As a client component its markup
 * is still rendered on the server, but the payload holds just a reference to it, and the browser builds the
 * same lists from the same seeds when it hydrates.
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
