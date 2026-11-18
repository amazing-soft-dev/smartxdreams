/**
 * The footer aurora's colours over time. The aurora has a bright lower edge and a warmer top, and both
 * drift slowly through the brand hues: violet, violet into coral, pale coral into violet, and back.
 * Each stop holds for a moment and eases into the next, and the mix happens in linear light so the
 * in-between colours stay bright instead of going muddy.
 */

export type Rgb = readonly [number, number, number];
export type AuroraColors = { low: Rgb; high: Rgb };

/** Brand tokens (globals.css @theme) used by the aurora. */
export const BRAND = {
  violet300: "#aa97ff",
  violet400: "#8b70ff",
  violet500: "#6d4aff",
  coral300: "#ffa17c",
  coral500: "#ff6b3d",
} as const;

/** The loop: the low edge and the high fringe at each stop, in order. The last stop eases back to the first. */
export const AURORA_STOPS: readonly { low: string; high: string }[] = [
  { low: BRAND.violet300, high: BRAND.violet500 },
  { low: BRAND.violet500, high: BRAND.coral500 },
  { low: BRAND.coral300, high: BRAND.violet400 },
];

/** Seconds for the whole loop through every stop. */
export const AURORA_CYCLE_SECONDS = 30;
/** Share of each stop's slot spent holding the colour before easing into the next one. */
export const AURORA_HOLD = 0.25;

/** `#rrggbb` to 0-1 sRGB. */
export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** Mixes two sRGB colours in linear light; returns sRGB. */
export function mixLinear(a: Rgb, b: Rgb, t: number): Rgb {
  const mix = (x: number, y: number) => toSrgb(toLinear(x) + (toLinear(y) - toLinear(x)) * t);
  return [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])];
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

const STOPS = AURORA_STOPS.map((s) => ({ low: hexToRgb(s.low), high: hexToRgb(s.high) }));

/** The aurora's colours at `seconds` since it started. Continuous, and periodic over AURORA_CYCLE_SECONDS. */
export function auroraPalette(seconds: number): AuroraColors {
  const slot = AURORA_CYCLE_SECONDS / STOPS.length;
  const t = (((seconds % AURORA_CYCLE_SECONDS) + AURORA_CYCLE_SECONDS) % AURORA_CYCLE_SECONDS) / slot;
  const index = Math.floor(t) % STOPS.length;
  const from = STOPS[index]!;
  const to = STOPS[(index + 1) % STOPS.length]!;
  const local = t - Math.floor(t);
  const blend = local < AURORA_HOLD ? 0 : smoothstep((local - AURORA_HOLD) / (1 - AURORA_HOLD));
  return { low: mixLinear(from.low, to.low, blend), high: mixLinear(from.high, to.high, blend) };
}
