/**
 * Star data for AstraField, generated from a fixed seed so every visit (and the server and client) gets the
 * same sky. Plain typed arrays, ready to upload as BufferGeometry attributes.
 */

/** mulberry32: a tiny, fast, seeded PRNG returning floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Star colours in linear-ish 0-1 RGB: mostly white, some violet-300, a few coral-300. */
const PALETTE = [
  { weight: 0.82, rgb: [1, 1, 1] },
  { weight: 0.12, rgb: [0xaa / 255, 0x97 / 255, 0xff / 255] },
  { weight: 0.06, rgb: [0xff / 255, 0xa1 / 255, 0x7c / 255] },
] as const;

export type StarField = {
  count: number;
  /** xyz per star. The field is a slab: wide in x and y, shallow in z (depth). */
  positions: Float32Array;
  /** rgb per star. */
  colors: Float32Array;
  /** Base point size per star, in pixels at depth 0. */
  sizes: Float32Array;
  /** Twinkle phase per star, 0 to 2*PI. */
  phases: Float32Array;
};

export type StarFieldOptions = {
  count?: number;
  seed?: number;
  /** Half extents of the slab. */
  width?: number;
  height?: number;
  depth?: number;
};

export function createStarField({
  count = 5000,
  seed = 20261116,
  width = 14,
  height = 8,
  depth = 6,
}: StarFieldOptions = {}): StarField {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random() * 2 - 1) * width;
    positions[i * 3 + 1] = (random() * 2 - 1) * height;
    positions[i * 3 + 2] = -random() * depth;

    let pick = random();
    let rgb: readonly number[] = PALETTE[0].rgb;
    for (const entry of PALETTE) {
      if (pick < entry.weight) {
        rgb = entry.rgb;
        break;
      }
      pick -= entry.weight;
    }
    colors[i * 3] = rgb[0] ?? 1;
    colors[i * 3 + 1] = rgb[1] ?? 1;
    colors[i * 3 + 2] = rgb[2] ?? 1;

    // Most stars are tiny; a few are larger and brighter (power curve).
    sizes[i] = 1 + random() ** 6 * 4;
    phases[i] = random() * Math.PI * 2;
  }

  return { count, positions, colors, sizes, phases };
}
