/**
 * The painted Earth plate behind the Home hero (`public/brand/earth`, see docs/brand.md): the Cloud-Formed
 * Emblem art, its files, the curve of its limb and where its landmarks are.
 *
 * Plate coordinates: `u` runs 0..1 left to right and `v` 0..1 top to bottom over the whole image. The plate is
 * 1.75 times as wide as it is tall, so one unit of `u` is PLATE_ASPECT plate heights wide.
 */

import emblemStrokes from "./emblem-strokes.json";

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

/**
 * The cloud emblem's mask, a quarter of the master's size, built with the variants by scripts/build-earth-plate.mjs
 * from the strokes traced in emblem-strokes.json:
 * - red: white on the emblem's two strokes, black elsewhere, softened at the edge. The scene keeps the cyclone's
 *   turn off what it covers.
 * - green: how far each pixel is from the strokes' edge (emblemDistance()), 0 on the strokes and white at
 *   EMBLEM_REGION_RANGE or further. The scene carries the plate near the emblem with it, fading out with distance.
 */
export const EMBLEM_MASK_SRC = "/brand/earth/earth-emblem-mask.png";

/** The emblem's strokes: centre lines and widths in master pixels (see emblem-strokes.json). */
export const EMBLEM_STROKES = emblemStrokes.strokes;

/** Plate heights of distance from the strokes that the mask's green channel spans, 0 to white. */
export const EMBLEM_REGION_RANGE = emblemStrokes.regionRange;

/** Each stroke's segments in plate heights: two ends and the stroke's half width. */
const EMBLEM_SEGMENTS = EMBLEM_STROKES.flatMap(({ width, points }) =>
  points.slice(1).map((end, i) => ({
    a: [points[i]![0]! / PLATE.height, points[i]![1]! / PLATE.height],
    b: [end[0]! / PLATE.height, end[1]! / PLATE.height],
    r: width / 2 / PLATE.height,
  })),
);

/**
 * How far plate point (x, y) (plate heights, y down) is from the edge of the emblem's nearest stroke, in plate
 * heights; 0 on a stroke. The mask's green channel holds this, so the scene and the build agree.
 */
export function emblemDistance(x: number, y: number): number {
  let nearest = Infinity;
  for (const { a, b, r } of EMBLEM_SEGMENTS) {
    const dx = b[0]! - a[0]!;
    const dy = b[1]! - a[1]!;
    const t = Math.min(1, Math.max(0, ((x - a[0]!) * dx + (y - a[1]!) * dy) / (dx * dx + dy * dy)));
    nearest = Math.min(nearest, Math.hypot(x - a[0]! - t * dx, y - a[1]! - t * dy) - r);
  }
  return Math.max(0, nearest);
}

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
 * - cyclone: the storm's eye at about (1458, 292) px, its painted arms reaching about 190 px out. The cloud
 *   emblem's upper stroke passes about 100 px from the eye, inside that reach; the emblem mask
 *   (EMBLEM_MASK_SRC) keeps the turn off it
 * - symbol: the cloud emblem, about x 1005–1540 and y 355–650 px
 */
export const LANDMARKS = {
  sunrise: { u: 688 / PLATE.width, v: 345 / PLATE.height },
  cyclone: { u: 1458 / PLATE.width, v: 292 / PLATE.height, radius: 190 / PLATE.height },
  symbol: {
    u: (1005 + 1540) / 2 / PLATE.width,
    v: (355 + 650) / 2 / PLATE.height,
    width: (1540 - 1005) / PLATE.width,
    height: (650 - 355) / PLATE.height,
  },
} as const;

/**
 * How far (plate heights) the painted atmosphere glow is kept outside the limb before it fades out: far enough
 * for the streaks of high cloud over the emblem art's limb, which reach about 110 px (0.115) above the rim
 * between the sunrise and the cyclone. glowCoverage() keeps the painted sky out of the band, so it can be this
 * wide without veiling the starfield. Shared by the shader and the fallback.
 */
export const GLOW_BAND = 0.12;

/**
 * The painted sky's own brightness, as the brighter of its red and green (0..1). The emblem art's sky is a
 * navy gradient: its red stays near 0 and its green under about 0.1 away from the planet, and only its blue
 * rises in the haze over the rim. The atmosphere's cyan rim, the sunrise and the pink streaks of high cloud are
 * bright in red or green, so how far that rises above this floor is how much of the glow there is.
 */
export const SKY_FLOOR = 0.1;
/** How far above SKY_FLOOR the glow is fully opaque. */
export const GLOW_RISE = 0.35;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * How much of a painted pixel outside the limb is atmosphere glow (0..1), from its red and green (0..1): none
 * for the navy sky and its blue haze, all for the bright rim, the sunrise and the high streaks. The shader
 * computes the same thing.
 */
export function glowCoverage(red: number, green: number): number {
  return smoothstep(SKY_FLOOR, SKY_FLOOR + GLOW_RISE, Math.max(red, green));
}

/** Within this many plate heights outside the limb the glow is kept whole; beyond, it fades out by GLOW_BAND. */
export const GLOW_EDGE = 0.008;

/** How much of the glow is kept at a signed limb distance (plate heights, negative in the sky). */
export function glowFade(distance: number): number {
  return smoothstep(-GLOW_BAND, -GLOW_EDGE, distance);
}

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
