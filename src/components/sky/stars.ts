/**
 * Star data for StarfieldSky, after the Framer "Starfield" component. Generated from a fixed seed, so the
 * server and the client render the same markup and every visit gets the same sky.
 */
import { seededRandom } from "@/components/astra/stars";

/** The sky behind the stars: rgb(7, 1, 23). Also the `space` colour token. */
export const SKY_BACKGROUND = "#070117";
export const STAR_COUNT = 200;
export const STAR_SEED = 20261117;
/** Star radius in px. */
export const STAR_SIZE = { min: 0.5, max: 2 } as const;
/** Half the stars are white, half pale blue. Drawn at full fill-opacity. */
export const STAR_COLORS = ["#FFFFFF", "#B5CFFF"] as const;
/** 0.2 is far (moves most on scroll), 1 is near (does not move). */
export const STAR_DEPTH = { min: 0.2, max: 1 } as const;
/** Each star starts its 2 s twinkle after a delay of up to this many seconds. */
export const TWINKLE_MAX_DELAY = 2;
/**
 * Stars are drawn in this many depth layers, each moved as one group on scroll. Layer k covers an equal slice
 * of the depth range and moves at the depth in the middle of its slice.
 */
export const DEPTH_LAYERS = 3;

/**
 * The size pulse: r = size + (0.5 + 0.5·sin(t/2000 + i) − 0.5)·0.25·size, which is
 * size·(1 + 0.125·sin(t/2000 + i)). It runs as a CSS scale keyframe of one sine period, 2000·2π ms, and each
 * star starts i radians into it.
 */
export const PULSE_AMOUNT = 0.125;
export const PULSE_MS_PER_RADIAN = 2000;
export const PULSE_PERIOD_MS = Math.round(2 * Math.PI * PULSE_MS_PER_RADIAN);

/** Negative animation delay that starts star i at phase i of the pulse, in ms. */
export function pulseDelayMs(i: number): number {
  return -Math.round((i % (2 * Math.PI)) * PULSE_MS_PER_RADIAN);
}

export type Star = {
  /** Index in the generated list. Also the phase of the size pulse, in radians. */
  i: number;
  /** Position in percent of the sky's width and height. */
  x: number;
  y: number;
  /** Radius in px. */
  size: number;
  color: (typeof STAR_COLORS)[number];
  depth: number;
  /** 0 (far) to DEPTH_LAYERS - 1 (near). */
  layer: number;
  /** Twinkle delay in seconds. */
  delay: number;
};

export type StarOptions = { count?: number; seed?: number };

/** Rounds to a few decimals, so the markup stays short and identical on the server and the client. */
const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** Which depth layer a depth falls in. */
export function depthLayer(depth: number): number {
  const t = (depth - STAR_DEPTH.min) / (STAR_DEPTH.max - STAR_DEPTH.min);
  return Math.min(DEPTH_LAYERS - 1, Math.max(0, Math.floor(t * DEPTH_LAYERS)));
}

/** The depth a whole layer moves at: the middle of its slice of the depth range. */
export function layerDepth(layer: number): number {
  const slice = (STAR_DEPTH.max - STAR_DEPTH.min) / DEPTH_LAYERS;
  return STAR_DEPTH.min + slice * (layer + 0.5);
}

/** The stars, in a fixed order. Thinning on scroll keeps the first N, so the order is random but stable. */
export function createStars({ count = STAR_COUNT, seed = STAR_SEED }: StarOptions = {}): Star[] {
  const random = seededRandom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  return Array.from({ length: count }, (_, i) => {
    const x = round(random() * 100, 3);
    const y = round(random() * 100, 3);
    const size = round(between(STAR_SIZE.min, STAR_SIZE.max), 3);
    const color = STAR_COLORS[random() < 0.5 ? 0 : 1];
    const depth = round(between(STAR_DEPTH.min, STAR_DEPTH.max), 3);
    const delay = round(random() * TWINKLE_MAX_DELAY, 3);
    return { i, x, y, size, color, depth, layer: depthLayer(depth), delay };
  });
}
