import { describe, expect, it } from "vitest";
import {
  HORIZON,
  horizonDistance,
  horizonPath,
  horizonV,
  LANDMARKS,
  PLATE,
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
    // painted arms above the eye run up to the limb, where motion() calms them.
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
