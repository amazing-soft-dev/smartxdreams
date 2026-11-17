/**
 * The painted Earth plate behind the Home hero (`public/brand/earth`, see docs/brand.md): its files, the curve
 * of its limb and where its landmarks are.
 *
 * Plate coordinates: `u` runs 0..1 left to right and `v` 0..1 top to bottom over the whole image. The plate is
 * twice as wide as it is tall, so one unit of `u` is two plate heights wide.
 */

/** Size of the master, in px. */
export const PLATE = { width: 1774, height: 887 } as const;

/** Width over height. */
export const PLATE_ASPECT = PLATE.width / PLATE.height;

/** The WebP variants, narrowest first. */
export const PLATE_VARIANTS = [
  { width: 768, src: "/brand/earth/earth-plate-768.webp" },
  { width: 1200, src: "/brand/earth/earth-plate-1200.webp" },
  { width: 1774, src: "/brand/earth/earth-plate-1774.webp" },
] as const;

export type PlateVariant = (typeof PLATE_VARIANTS)[number];

/** The narrowest variant at least `pixels` wide (device pixels the plate covers), or the master above that. */
export function pickPlateVariant(pixels: number): PlateVariant {
  return PLATE_VARIANTS.find((variant) => variant.width >= pixels) ?? PLATE_VARIANTS[PLATE_VARIANTS.length - 1]!;
}

/** `srcset` for an <img> or a preload: every variant with its width. */
export const PLATE_SRCSET = PLATE_VARIANTS.map((variant) => `${variant.src} ${variant.width}w`).join(", ");

/**
 * The limb as a cubic: v = h0 + h1·u + h2·u² + h3·u³ is where the atmosphere starts in each column. Fitted by
 * scripts/measure-earth-plate.mjs (192 of 222 columns, within 6 px over the full width); run it again if the
 * art changes.
 */
export const HORIZON = [0.76936, -1.61125, 1.15802, -0.16701] as const;

/** Height (v) of the limb at `u`. */
export function horizonV(u: number): number {
  const [h0, h1, h2, h3] = HORIZON;
  return ((h3 * u + h2) * u + h1) * u + h0;
}

/** Slope dv/du of the limb at `u`. */
export function horizonSlope(u: number): number {
  const [, h1, h2, h3] = HORIZON;
  return (3 * h3 * u + 2 * h2) * u + h1;
}

/**
 * Signed distance from the limb, in plate heights: positive on the planet (below the limb), negative in the
 * sky. The vertical gap is divided by the length of the curve's normal, so the distance is the same across
 * the steep left end and the flat right end. The shader computes the same thing.
 */
export function horizonDistance(u: number, v: number): number {
  const slope = horizonSlope(u) / PLATE_ASPECT; // dv per plate height of x
  return (v - horizonV(u)) / Math.hypot(1, slope);
}

/**
 * Landmarks, measured by eye on the 1774 × 887 master (see docs/earth.md). `u` and `v` are centres; the
 * cyclone's `radius` and the symbol's `height` are in plate heights, its `width` in `u`.
 * - sunrise: the hottest point of the sun's glare on the limb, about (730, 285) px
 * - cyclone: the storm's eye at about (1545, 262) px, its spiral reaching about 120 px out
 * - symbol: the S and D in clouds, about x 1065–1470 and y 310–635 px
 */
export const LANDMARKS = {
  sunrise: { u: 730 / PLATE.width, v: 285 / PLATE.height },
  cyclone: { u: 1545 / PLATE.width, v: 262 / PLATE.height, radius: 120 / PLATE.height },
  symbol: {
    u: (1065 + 1470) / 2 / PLATE.width,
    v: (310 + 635) / 2 / PLATE.height,
    width: (1470 - 1065) / PLATE.width,
    height: (635 - 310) / PLATE.height,
  },
} as const;

/**
 * The limb as an SVG path in plate pixels, closed along the bottom: the planet's outline for a clip path.
 * Sampled every `step` px; the cubic is smooth enough that straight segments are invisible.
 */
export function horizonPath(step = 32): string {
  const points: string[] = [];
  for (let x = 0; x < PLATE.width; x += step) points.push(`${x} ${(horizonV(x / PLATE.width) * PLATE.height).toFixed(1)}`);
  points.push(`${PLATE.width} ${(horizonV(1) * PLATE.height).toFixed(1)}`);
  return `M${points.join("L")}L${PLATE.width} ${PLATE.height}L0 ${PLATE.height}Z`;
}
