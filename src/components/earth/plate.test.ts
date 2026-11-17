import { describe, expect, it } from "vitest";
import {
  HORIZON,
  horizonDistance,
  horizonPath,
  horizonV,
  LANDMARKS,
  PLATE,
  PLATE_SRCSET,
  PLATE_VARIANTS,
  pickPlateVariant,
} from "./plate";

/**
 * Where the blue atmosphere starts, read off the 1774 × 887 master in a few columns away from the sun's
 * glare (x, y px). The fitted horizon must pass within 6 px of each.
 */
const LIMB_SAMPLES: [number, number][] = [
  [0, 687],
  [110, 597],
  [220, 518],
  [330, 449],
  [440, 389],
  [550, 337],
  [880, 206],
  [990, 177],
  [1100, 156],
  [1210, 140],
  [1320, 127],
  [1540, 117],
  [1650, 122],
  [1760, 132],
];

describe("horizon", () => {
  it("follows the measured limb within 6 px", () => {
    for (const [x, y] of LIMB_SAMPLES) {
      expect(Math.abs(horizonV(x / PLATE.width) * PLATE.height - y), `column ${x}`).toBeLessThanOrEqual(6);
    }
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
    // The whole symbol and the cyclone's spiral sit below the limb.
    expect(horizonDistance(symbol.u, symbol.v - symbol.height / 2)).toBeGreaterThan(0);
    expect(horizonDistance(cyclone.u, cyclone.v - cyclone.radius)).toBeGreaterThan(0);
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
    expect(pickPlateVariant(5000).width).toBe(1774);
  });

  it("lists every variant in the srcset", () => {
    for (const { src, width } of PLATE_VARIANTS) expect(PLATE_SRCSET).toContain(`${src} ${width}w`);
  });
});

describe("horizonPath", () => {
  it("runs along the limb from the left edge to the right and closes along the bottom", () => {
    const path = horizonPath();
    expect(path.startsWith(`M0 ${(horizonV(0) * PLATE.height).toFixed(1)}`)).toBe(true);
    expect(path).toContain(`L${PLATE.width} ${(horizonV(1) * PLATE.height).toFixed(1)}`);
    expect(path.endsWith(`L${PLATE.width} ${PLATE.height}L0 ${PLATE.height}Z`)).toBe(true);
  });
});
