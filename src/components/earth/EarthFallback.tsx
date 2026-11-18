"use client";

import { useEffect, useRef } from "react";
import { StarfieldSky } from "@/components/sky/StarfieldSky";
import { type SceneSupport, useSceneSupport } from "@/components/webgl/useSceneSupport";
import { cx } from "@/lib/cx";
import styles from "./EarthFallback.module.css";
import { maskGlow } from "./glow-mask";
import { horizonPath, PLATE, pickPlateVariant } from "./plate";
import { plateLayoutCss } from "./plate-layout";

/** The plate's placement per breakpoint: plateRect() in CSS, the same numbers the scene uses. */
const LAYOUT_CSS = plateLayoutCss("[data-earth-fallback]");

/** The planet's outline, in plate pixels. */
const PLANET_PATH = horizonPath();
/** The glow is soft, so its canvas holds half the planet's pixels in each direction: a quarter of the work. */
const GLOW_RESOLUTION = 0.5;

/**
 * Whether the still planet drifts: only once it is known that the scene will not run, and not because the
 * visitor asked for reduced motion. Undecided ("pending", the server render) is still.
 */
export function fallbackDrifts(support: SceneSupport): boolean {
  return support.status === "fallback" && support.reason !== "reduced-motion";
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * The Earth backdrop without WebGL: the starfield sky, and over it the painted plate placed exactly as the
 * scene places it, cut to the planet's oval, with its painted atmosphere glow kept just outside the limb. It
 * is all that shows for reduced motion, data saver, low-power devices and missing WebGL 2. The scene draws over
 * it and is transparent outside the planet, so the sky here is the sky in both cases. Decorative.
 *
 * The plate is drawn into two canvases sized by the layout CSS: the planet, clipped to the limb, and the glow,
 * the plate outside the limb with each pixel kept as much as the scene's shader keeps it (maskGlow()): the
 * rim, the sunrise and the high streaks, fading out across the band, and none of the painted navy sky.
 * Canvases rather than images on purpose: a canvas is never a Largest Contentful Paint candidate, so the large,
 * decorative plate cannot take that over from the headline on a slow phone. The variant is picked as the scene
 * picks it, with the same request mode, so the scene reuses the download. Drawing waits for an idle moment, so
 * it never competes with the first paint of the copy on a slow phone.
 *
 * Where the scene will never run but motion is welcome (no WebGL 2, data saver, a low-power device), the still
 * planet drifts slowly, as the scene's orbital drift does (fallbackDrifts()), so it still feels alive. Where
 * the scene will run, it stays still until the scene fades in over it: a drift under the scene would not line
 * up with it during the fade. With reduced motion nothing moves.
 */
export function EarthFallback({ className }: { className?: string }) {
  const planetRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const drift = fallbackDrifts(useSceneSupport());

  useEffect(() => {
    const planet = planetRef.current;
    const glow = glowRef.current;
    const planetCtx = planet?.getContext("2d");
    // The glow's pixels are read back once per draw to mask them.
    const glowCtx = glow?.getContext("2d", { willReadFrequently: true });
    if (!planet || !glow || !planetCtx || !glowCtx) return;
    const planetPath = new Path2D(PLANET_PATH);
    let image: HTMLImageElement | null = null;
    let requestedWidth = 0;
    let cancelled = false;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const draw = () => {
      const width = planet.getBoundingClientRect().width;
      if (!image || width === 0) return;
      // Never more pixels than the plate has: past its own size it would only be upscaled.
      const w = Math.round(Math.min(width * dpr(), PLATE.width));
      const sizes: [HTMLCanvasElement, number][] = [
        [planet, w],
        [glow, Math.max(1, Math.round(w * GLOW_RESOLUTION))],
      ];
      for (const [canvas, cw] of sizes) {
        const ch = Math.round((cw * PLATE.height) / PLATE.width);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
      }
      const scale = w / PLATE.width;
      const glowScale = glow.width / PLATE.width;

      // The planet: the plate clipped to the limb.
      planetCtx.setTransform(scale, 0, 0, scale, 0, 0);
      planetCtx.clearRect(0, 0, PLATE.width, PLATE.height);
      planetCtx.save();
      planetCtx.clip(planetPath);
      planetCtx.drawImage(image, 0, 0, PLATE.width, PLATE.height);
      planetCtx.restore();

      // The glow: the plate, then each pixel kept as the shader keeps it outside the limb.
      glowCtx.setTransform(glowScale, 0, 0, glowScale, 0, 0);
      glowCtx.clearRect(0, 0, PLATE.width, PLATE.height);
      glowCtx.drawImage(image, 0, 0, PLATE.width, PLATE.height);
      const pixels = glowCtx.getImageData(0, 0, glow.width, glow.height);
      maskGlow(pixels.data, glow.width, glow.height);
      glowCtx.putImageData(pixels, 0, 0);
    };

    // The narrowest variant that covers the plate's device pixels, as EarthScene picks it; a sharper one if a
    // resize needs it. Same request mode as three.js's loader, so the two share the cached file.
    const load = () => {
      const variant = pickPlateVariant(planet.getBoundingClientRect().width * dpr());
      if (variant.width <= requestedWidth) return scheduleDraw();
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
          scheduleDraw();
        })
        .catch(() => {
          // The plate failed to load: the sky stays on its own.
        });
    };

    // Draw when the browser is idle (at most a second later), so the plate never holds up the copy's paint.
    const win = window as IdleWindow;
    let idle: number | undefined;
    const scheduleDraw = () => {
      if (idle !== undefined) return;
      const run = () => {
        idle = undefined;
        draw();
      };
      idle = win.requestIdleCallback ? win.requestIdleCallback(run, { timeout: 1000 }) : window.setTimeout(run, 200);
    };
    const cancelDraw = () => {
      if (idle === undefined) return;
      if (win.cancelIdleCallback) win.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      idle = undefined;
    };

    const resize = new ResizeObserver(load);
    resize.observe(planet);
    load();
    return () => {
      cancelled = true;
      cancelDraw();
      resize.disconnect();
    };
  }, []);

  return (
    <div data-earth-fallback="" data-drift={drift ? "" : undefined} aria-hidden="true" className={cx(styles.root, className)}>
      <style>{LAYOUT_CSS}</style>
      <StarfieldSky />
      <canvas ref={glowRef} data-earth-plate="glow" className={styles.plate} />
      <canvas ref={planetRef} data-earth-plate="planet" className={styles.plate} />
    </div>
  );
}
