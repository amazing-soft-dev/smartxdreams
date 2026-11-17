/**
 * Which pointer moves stir the Earth: only a fine pointer that can hover, moving over the planet itself (not
 * the sky, and not within the still band at the limb), and not over something the visitor interacts with.
 * The sky never reacts to the pointer.
 */

import { horizonDistance } from "./plate";
import { heroToPlate, type PlateRect } from "./plate-layout";
import { CALM_LIMB } from "./plate-shader";

/** Pointers over these move the page's controls, not the clouds. */
export const EARTH_IGNORE_SELECTOR = "a, button, input, select, textarea, label, summary, [data-earth-ignore]";

/** The media query a pointer must match to stir the clouds: a mouse or trackpad, not touch. */
export const EARTH_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * True when the hero point (x, y), in hero heights from the bottom-left, is on the planet and clear of the
 * still band at the limb.
 */
export function isOnEarth(rect: PlateRect, x: number, y: number): boolean {
  const { u, v } = heroToPlate(rect, x, y);
  if (u < 0 || u > 1 || v < 0 || v > 1) return false;
  return horizonDistance(u, v) > CALM_LIMB;
}

/** How many splats a move of (dx, dy) CSS px is broken into, so each covers at most `step` px (1 to 16). */
export function splatCount(dx: number, dy: number, step = 10): number {
  return Math.min(16, Math.max(1, Math.ceil(Math.hypot(dx, dy) / step)));
}
