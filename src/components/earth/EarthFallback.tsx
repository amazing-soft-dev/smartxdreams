"use client";

import { useEffect, useRef } from "react";
import { StarfieldSky } from "@/components/sky/StarfieldSky";
import { cx } from "@/lib/cx";
import styles from "./EarthFallback.module.css";
import { GLOW_BAND, horizonPath, PLATE, pickPlateVariant } from "./plate";
import { plateLayoutCss } from "./plate-layout";

/** The plate's placement per breakpoint: plateRect() in CSS, the same numbers the scene uses. */
const LAYOUT_CSS = plateLayoutCss("[data-earth-fallback]");

/** The planet's outline, and the glow band's outer edge (the outline lifted by GLOW_BAND), in plate pixels. */
const PLANET_PATH = horizonPath();
const GLOW_PATH = horizonPath(32, GLOW_BAND);
/** Softness of the glow band's outer edge, in plate pixels. */
const GLOW_SOFTNESS = 10;

/**
 * The Earth backdrop without WebGL: the starfield sky, and over it the painted plate placed exactly as the
 * scene places it, cut to the planet's oval, with its painted atmosphere glow kept just outside the limb. It
 * is all that shows for reduced motion, data saver, low-power devices and missing WebGL 2. The scene draws over
 * it and is transparent outside the planet, so the sky here is the sky in both cases. Decorative.
 *
 * The plate is drawn into two canvases sized by the layout CSS: the planet, clipped to the limb, and the glow,
 * the plate masked to a soft band above the limb and blended with `screen` (the painted sky is black, so it
 * adds nothing, and the glow lightens the stars behind it, as the scene's brightness-as-coverage does).
 * Canvases rather than images on purpose: a canvas is never a Largest Contentful Paint candidate, so the large,
 * decorative plate cannot take that over from the headline on a slow phone. The variant is picked as the scene
 * picks it, with the same request mode, so the scene reuses the download.
 */
export function EarthFallback({ className }: { className?: string }) {
  const planetRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const planet = planetRef.current;
    const glow = glowRef.current;
    const planetCtx = planet?.getContext("2d");
    const glowCtx = glow?.getContext("2d");
    if (!planet || !glow || !planetCtx || !glowCtx) return;
    const planetPath = new Path2D(PLANET_PATH);
    const glowPath = new Path2D(GLOW_PATH);
    let image: HTMLImageElement | null = null;
    let requestedWidth = 0;
    let cancelled = false;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const draw = () => {
      const width = planet.getBoundingClientRect().width;
      if (!image || width === 0) return;
      // Never more pixels than the plate has: past its own size it would only be upscaled.
      const w = Math.round(Math.min(width * dpr(), PLATE.width));
      const h = Math.round((w * PLATE.height) / PLATE.width);
      for (const canvas of [planet, glow]) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }
      const scale = w / PLATE.width;

      // The planet: the plate clipped to the limb.
      planetCtx.setTransform(scale, 0, 0, scale, 0, 0);
      planetCtx.clearRect(0, 0, PLATE.width, PLATE.height);
      planetCtx.save();
      planetCtx.clip(planetPath);
      planetCtx.drawImage(image, 0, 0, PLATE.width, PLATE.height);
      planetCtx.restore();

      // The glow: the plate kept only inside a soft band reaching GLOW_BAND above the limb.
      glowCtx.setTransform(scale, 0, 0, scale, 0, 0);
      glowCtx.globalCompositeOperation = "source-over";
      glowCtx.clearRect(0, 0, PLATE.width, PLATE.height);
      glowCtx.drawImage(image, 0, 0, PLATE.width, PLATE.height);
      glowCtx.globalCompositeOperation = "destination-in";
      // Canvas filters are in canvas pixels. Browsers without them get a hard band edge, which the glow's own
      // fade mostly hides.
      glowCtx.filter = `blur(${(GLOW_SOFTNESS * scale).toFixed(2)}px)`;
      glowCtx.fill(glowPath);
      glowCtx.filter = "none";
      glowCtx.globalCompositeOperation = "source-over";
    };

    // The narrowest variant that covers the plate's device pixels, as EarthScene picks it; a sharper one if a
    // resize needs it. Same request mode as three.js's loader, so the two share the cached file.
    const load = () => {
      const variant = pickPlateVariant(planet.getBoundingClientRect().width * dpr());
      if (variant.width <= requestedWidth) return draw();
      requestedWidth = variant.width;
      const next = new Image();
      next.crossOrigin = "anonymous";
      next.decoding = "async";
      next.src = variant.src;
      next
        .decode()
        .then(() => {
          if (cancelled) return;
          image = next;
          draw();
        })
        .catch(() => {
          // The plate failed to load: the sky stays on its own.
        });
    };

    const resize = new ResizeObserver(load);
    resize.observe(planet);
    load();
    return () => {
      cancelled = true;
      resize.disconnect();
    };
  }, []);

  return (
    <div data-earth-fallback="" aria-hidden="true" className={cx(styles.root, className)}>
      <style>{LAYOUT_CSS}</style>
      <StarfieldSky />
      <canvas ref={glowRef} data-earth-plate="glow" className={cx(styles.plate, styles.glow)} />
      <canvas ref={planetRef} data-earth-plate="planet" className={styles.plate} />
    </div>
  );
}
