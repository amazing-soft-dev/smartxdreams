/**
 * How StarfieldSky answers the page scroll, after the Framer "Starfield" component: far stars drift down
 * against the scroll (depth parallax) and the sky thins out toward the bottom of the page.
 */

export const PARALLAX = {
  /** Percent of the sky's height per px scrolled, times (1 − depth). */
  factor: 0.03,
  /** The parallax eases in over this many px of scroll. */
  ramp: 3000,
} as const;

/** At the bottom of the page this share of the stars is still shown. */
export const THIN_TO = 0.4;

/** easeInOutQuad. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** How far stars at `depth` move down, in percent of the sky's height: scrollY·(1−depth)·0.03·ease. */
export function parallaxOffset(scrollY: number, depth: number): number {
  const y = Math.max(0, scrollY);
  return y * (1 - depth) * PARALLAX.factor * easeInOut(Math.min(1, y / PARALLAX.ramp));
}

/** 0 at the top of the page, 1 at the bottom. 0 when the page does not scroll. */
export function scrollProgress(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const max = scrollHeight - viewportHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}

/** Stars shown at `progress`: all of them at the top, falling linearly to 40 % at the bottom. */
export function visibleStarCount(total: number, progress: number): number {
  return Math.round(total * (1 - (1 - THIN_TO) * Math.min(1, Math.max(0, progress))));
}
