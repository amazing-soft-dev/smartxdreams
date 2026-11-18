/**
 * The painted Earth plate behind the Home hero (`public/brand/earth`, see docs/brand.md): the Cloud-Formed
 * Emblem art, its files, the curve of its limb and where its landmarks are.
 *
 * Plate coordinates: `u` runs 0..1 left to right and `v` 0..1 top to bottom over the whole image. The plate is
 * 1.75 times as wide as it is tall, so one unit of `u` is PLATE_ASPECT plate heights wide.
 */

/** Size of the master, in px. */
export const PLATE = { width: 1659, height: 948 } as const;

/** Width over height. */
export const PLATE_ASPECT = PLATE.width / PLATE.height;

/** The WebP variants, narrowest first. */
export const PLATE_VARIANTS = [
  { width: 768, src: "/brand/earth/earth-emblem-768.webp" },
  { width: 1200, src: "/brand/earth/earth-emblem-1200.webp" },
  { width: 1659, src: "/brand/earth/earth-emblem-1659.webp" },
] as const;

export type PlateVariant = (typeof PLATE_VARIANTS)[number];

/** The narrowest variant at least `pixels` wide (device pixels the plate covers), or the master above that. */
export function pickPlateVariant(pixels: number): PlateVariant {
  return PLATE_VARIANTS.find((variant) => variant.width >= pixels) ?? PLATE_VARIANTS[PLATE_VARIANTS.length - 1]!;
}

/**
 * The limb as a cubic: v = h0 + h1·u + h2·u² + h3·u³ is where the bright rim starts in each column. Fitted by
 * scripts/measure-earth-plate.mjs (130 of 145 columns from 40 to 1656 px, within 8.5 px; the sun's glare
 * hides the rim from 460 to 960 px, so those columns are not measured); run it again if the art changes.
 */
export const HORIZON = [0.8629, -1.85294, 1.47685, -0.30074] as const;

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
 * Landmarks, measured by eye on the 1659 × 948 master (see docs/earth.md). `u` and `v` are centres; the
 * cyclone's `radius` and the symbol's `height` are in plate heights, its `width` in `u`.
 * - sunrise: the hottest point of the sun's glare, just inside the limb, about (688, 345) px
 * - cyclone: the storm's eye at about (1458, 292) px. Its painted arms reach about 190 px out, but the cloud
 *   emblem's upper stroke is only about 95 px from the eye, so the turning reach is kept to 105 px
 * - symbol: the cloud emblem, about x 1005–1540 and y 355–650 px
 */
export const LANDMARKS = {
  sunrise: { u: 688 / PLATE.width, v: 345 / PLATE.height },
  cyclone: { u: 1458 / PLATE.width, v: 292 / PLATE.height, radius: 105 / PLATE.height },
  symbol: {
    u: (1005 + 1540) / 2 / PLATE.width,
    v: (355 + 650) / 2 / PLATE.height,
    width: (1540 - 1005) / PLATE.width,
    height: (650 - 355) / PLATE.height,
  },
} as const;

/**
 * How far (plate heights) the painted atmosphere glow is kept outside the limb before it fades out. Shared by
 * the shader and the fallback.
 */
export const GLOW_BAND = 0.06;

/**
 * The limb as an SVG path in plate pixels, closed along the bottom: the planet's outline for a clip path.
 * Sampled every `step` px; the cubic is smooth enough that straight segments are invisible. `lift` raises the
 * whole outline by that many plate heights (the glow band's outline).
 */
export function horizonPath(step = 32, lift = 0): string {
  const y = (u: number) => ((horizonV(u) - lift) * PLATE.height).toFixed(1);
  const points: string[] = [];
  for (let x = 0; x < PLATE.width; x += step) points.push(`${x} ${y(x / PLATE.width)}`);
  points.push(`${PLATE.width} ${y(1)}`);
  return `M${points.join("L")}L${PLATE.width} ${PLATE.height}L0 ${PLATE.height}Z`;
}
