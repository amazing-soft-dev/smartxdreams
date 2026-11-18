import { describe, expect, it } from "vitest";
import {
  EMBLEM_MASK_SRC,
  EMBLEM_REGION_RANGE,
  EMBLEM_STROKES,
  emblemDistance,
  HORIZON,
  horizonDistance,
  horizonPath,
  horizonV,
  LANDMARKS,
  PLATE,
  PLATE_ASPECT,
  PLATE_VARIANTS,
  pickPlateVariant,
} from "./plate";

/**
 * Where the bright rim starts, read off the 1659 × 948 master in columns away from the sun's glare (which
 * hides the rim from about 460 to 960 px) and from cloud tops over the rim (x, y px). The fitted horizon must
 * pass within 8 px of each.
 */
const LIMB_SAMPLES: [number, number][] = [
  [60, 760],
  [160, 659],
  [260, 575],
  [360, 499],
  [440, 448],
  [1000, 212],
  [1100, 183],
  [1200, 174],
  [1400, 163],
  [1500, 163],
  [1600, 172],
  [1650, 178],
];

describe("horizon", () => {
  it("follows the measured rim within 8 px", () => {
    for (const [x, y] of LIMB_SAMPLES) {
      expect(Math.abs(horizonV(x / PLATE.width) * PLATE.height - y), `column ${x}`).toBeLessThanOrEqual(8);
    }
  });

  it("does not follow the painted haze above the rim", () => {
    // The navy haze is already blue 90 to 170 some 60 to 80 px above the rim on the right; the limb is the
    // rim itself.
    expect(horizonV(1400 / PLATE.width) * PLATE.height).toBeGreaterThan(150);
  });

  it("is a cubic with four coefficients", () => {
    expect(HORIZON).toHaveLength(4);
  });

  it("is positive on the planet and negative in the sky", () => {
    const { symbol, cyclone } = LANDMARKS;
    expect(horizonDistance(symbol.u, symbol.v)).toBeGreaterThan(0);
    expect(horizonDistance(cyclone.u, cyclone.v)).toBeGreaterThan(0);
    // The top-left corner is sky.
    expect(horizonDistance(0.05, 0.05)).toBeLessThan(0);
  });

  it("measures across the curve, not straight down, where the limb is steep", () => {
    // On the steep left end a point 0.05 below the limb is less than 0.05 away from it.
    const u = 0.05;
    expect(horizonDistance(u, horizonV(u) + 0.05)).toBeLessThan(0.05);
    // On the flat right end the two nearly agree.
    expect(horizonDistance(0.9, horizonV(0.9) + 0.05)).toBeCloseTo(0.05, 2);
  });
});

describe("landmarks", () => {
  it("all lie on the plate", () => {
    for (const { u, v } of Object.values(LANDMARKS)) {
      expect(u).toBeGreaterThan(0);
      expect(u).toBeLessThan(1);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("put the sunrise on the limb, and the cyclone and symbol on the planet", () => {
    expect(Math.abs(horizonDistance(LANDMARKS.sunrise.u, LANDMARKS.sunrise.v))).toBeLessThan(0.08);
    const { symbol, cyclone } = LANDMARKS;
    // The whole emblem and the cyclone's full-strength core (the inner 55% of its reach) sit below the limb. The
    // painted arms above the eye run up to the limb, where limbSafe() calms them.
    expect(horizonDistance(symbol.u, symbol.v - symbol.height / 2)).toBeGreaterThan(0);
    expect(horizonDistance(cyclone.u, cyclone.v - cyclone.radius * 0.55)).toBeGreaterThan(0);
  });
});

describe("variants", () => {
  it("are sorted narrowest first and end with the master", () => {
    for (let i = 1; i < PLATE_VARIANTS.length; i++) {
      expect(PLATE_VARIANTS[i]!.width).toBeGreaterThan(PLATE_VARIANTS[i - 1]!.width);
    }
    expect(PLATE_VARIANTS.at(-1)!.width).toBe(PLATE.width);
  });

  it("picks the narrowest variant wide enough, and the master above that", () => {
    expect(pickPlateVariant(500).width).toBe(768);
    expect(pickPlateVariant(768).width).toBe(768);
    expect(pickPlateVariant(769).width).toBe(1200);
    expect(pickPlateVariant(1659).width).toBe(1659);
    expect(pickPlateVariant(5000).width).toBe(1659);
  });

  it("are the emblem art's WebP files", () => {
    for (const { width, src } of PLATE_VARIANTS) expect(src).toBe(`/brand/earth/earth-emblem-${width}.webp`);
  });

});

describe("horizonPath", () => {
  it("lifts the whole outline for the glow band", () => {
    const lifted = horizonPath(32, 0.12);
    expect(lifted.startsWith(`M0 ${((horizonV(0) - 0.12) * PLATE.height).toFixed(1)}`)).toBe(true);
    expect(lifted.endsWith(`L${PLATE.width} ${PLATE.height}L0 ${PLATE.height}Z`)).toBe(true);
  });

  it("runs along the limb from the left edge to the right and closes along the bottom", () => {
    const path = horizonPath();
    expect(path.startsWith(`M0 ${(horizonV(0) * PLATE.height).toFixed(1)}`)).toBe(true);
    expect(path).toContain(`L${PLATE.width} ${(horizonV(1) * PLATE.height).toFixed(1)}`);
    expect(path.endsWith(`L${PLATE.width} ${PLATE.height}L0 ${PLATE.height}Z`)).toBe(true);
  });
});

describe("emblem mask", () => {
  it("is built next to the variants", async () => {
    const { existsSync } = await import("node:fs");
    expect(EMBLEM_MASK_SRC).toBe("/brand/earth/earth-emblem-mask.png");
    expect(existsSync(`public${EMBLEM_MASK_SRC}`)).toBe(true);
  });

  it("is one greyscale channel, the distance from the strokes, as emblemDistance() works it out", async () => {
    const { default: sharp } = await import("sharp");
    const file = `public${EMBLEM_MASK_SRC}`;
    expect((await sharp(file).metadata()).channels).toBe(1);
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    let worst = 0;
    for (let j = 2; j < info.height; j += 7) {
      for (let i = 3; i < info.width; i += 7) {
        const k = (j * info.width + i) * info.channels;
        const x = ((i + 0.5) / info.width) * PLATE_ASPECT;
        const y = (j + 0.5) / info.height;
        const expected = Math.min(1, emblemDistance(x, y) / EMBLEM_REGION_RANGE);
        worst = Math.max(worst, Math.abs(data[k]! / 255 - expected));
      }
    }
    expect(worst).toBeLessThanOrEqual(1 / 255 + 1e-9);
  });
});

describe("emblemDistance", () => {
  it("is zero along every stroke's centre line and grows away from the strokes", () => {
    for (const { points } of EMBLEM_STROKES) {
      for (const [x, y] of points) expect(emblemDistance(x! / PLATE.height, y! / PLATE.height)).toBe(0);
    }
    // The open ocean left of the emblem and the far right of the plate are well away from it.
    expect(emblemDistance(800 / PLATE.height, 450 / PLATE.height)).toBeGreaterThan(0.15);
    expect(emblemDistance(1650 / PLATE.height, 900 / PLATE.height)).toBeGreaterThan(0.2);
  });

  it("changes no faster than the distance moved, so a fade over it is as smooth as over any distance", () => {
    for (let x = 0.9; x < PLATE_ASPECT; x += 0.013) {
      for (let y = 0.2; y < 0.9; y += 0.011) {
        expect(Math.abs(emblemDistance(x + 0.002, y) - emblemDistance(x, y))).toBeLessThanOrEqual(0.002 + 1e-12);
      }
    }
  });
});
