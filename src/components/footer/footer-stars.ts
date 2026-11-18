/**
 * Star data for the footer sky, after the StarfieldFX layers and Black Jupiter's star mix. Each depth layer
 * is one tiny round element whose `box-shadow` list paints every star in a tile. The layer scrolls up by one
 * tile height and a copy one tile below fills the gap, so the drift never shows a seam. Seeded, so the
 * server and the client render the same markup.
 */
import { seededRandom } from "@/components/astra/stars";

/** One tile of stars. Wide enough for a 2560 px screen; the height is also the drift distance. */
export const STAR_TILE = { width: 2560, height: 2000 } as const;

/** Base star colours: mostly white and pale blue (as in the hero sky), with a few brand tints. */
export const FOOTER_STAR_COLORS = [
  [255, 255, 255],
  [255, 255, 255],
  [181, 207, 255],
  [170, 151, 255], // violet-300
  [255, 161, 124], // coral-300
] as const;

/** Per-star opacity range, as in Black Jupiter (0.4 to 1). */
export const STAR_ALPHA = { min: 0.4, max: 1 } as const;
/** Share of stars that also get a faint glow around them. */
export const HALO_CHANCE = 0.015;

export type StarLayer = {
  /** Star diameter in px: the layer element's size, which every shadow copies. */
  size: number;
  count: number;
  /** Seconds to drift up one tile height. Far (small) stars move fastest, as in StarfieldFX. */
  duration: number;
  seed: number;
};

/** Far to near. StarfieldFX's 1/2/3 px layers at 50/100/150 s, thinned for a footer-sized sky. */
export const STAR_LAYERS: readonly StarLayer[] = [
  { size: 1, count: 450, duration: 50, seed: 4371 },
  { size: 2, count: 150, duration: 100, seed: 4372 },
  { size: 3, count: 60, duration: 150, seed: 4373 },
];

/** Rounds to a few decimals, so the markup stays short and identical on the server and the client. */
const round = (value: number, digits: number) => Number(value.toFixed(digits));

/**
 * The `box-shadow` value for one layer: one shadow per star at a seeded spot in the tile. The layer element
 * has `border-radius: 50%`, and a box-shadow takes its element's shape, so every star is a circle. The 2 and
 * 3 px stars get a slight blur for a soft edge; a rare star gets a second, wider, dimmer shadow as a halo.
 */
export function buildStarShadows({ size, count, seed }: Pick<StarLayer, "size" | "count" | "seed">): string {
  const random = seededRandom(seed);
  const blur = size > 1 ? round(size * 0.2, 2) : 0;
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(random() * STAR_TILE.width);
    const y = Math.floor(random() * STAR_TILE.height);
    const [r, g, b] = FOOTER_STAR_COLORS[Math.floor(random() * FOOTER_STAR_COLORS.length)]!;
    const alpha = round(STAR_ALPHA.min + random() * (STAR_ALPHA.max - STAR_ALPHA.min), 2);
    shadows.push(`${x}px ${y}px ${blur}px rgb(${r} ${g} ${b} / ${alpha})`);
    if (random() < HALO_CHANCE) {
      shadows.push(`${x}px ${y}px ${size * 3}px ${size}px rgb(${r} ${g} ${b} / ${round(alpha * 0.25, 2)})`);
    }
  }
  return shadows.join(", ");
}
