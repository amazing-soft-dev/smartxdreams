import { describe, expect, it } from "vitest";
import { buildStarShadows, STAR_ALPHA, STAR_LAYERS, STAR_TILE } from "./footer-stars";

const parse = (value: string) =>
  value.split(", ").map((shadow) => {
    const match = /^(\d+)px (\d+)px ([\d.]+)px (?:(\d+)px )?rgb\(\d+ \d+ \d+ \/ ([\d.]+)\)$/.exec(shadow);
    if (!match) throw new Error(`Unexpected shadow: ${shadow}`);
    return { x: Number(match[1]), y: Number(match[2]), spread: match[4], alpha: Number(match[5]) };
  });

describe("buildStarShadows", () => {
  it("gives the same sky for the same seed, so server and client markup match", () => {
    for (const layer of STAR_LAYERS) expect(buildStarShadows(layer)).toBe(buildStarShadows(layer));
  });

  it("gives a different sky for a different seed", () => {
    expect(buildStarShadows({ size: 1, count: 20, seed: 1 })).not.toBe(buildStarShadows({ size: 1, count: 20, seed: 2 }));
  });

  it("puts one star per count inside the tile, plus a few halos", () => {
    for (const layer of STAR_LAYERS) {
      const shadows = parse(buildStarShadows(layer));
      const stars = shadows.filter((s) => s.spread === undefined);
      const halos = shadows.filter((s) => s.spread !== undefined);
      expect(stars).toHaveLength(layer.count);
      expect(halos.length).toBeLessThan(layer.count * 0.06);
      for (const star of stars) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThan(STAR_TILE.width);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThan(STAR_TILE.height);
        expect(star.alpha).toBeGreaterThanOrEqual(STAR_ALPHA.min);
        expect(star.alpha).toBeLessThanOrEqual(STAR_ALPHA.max);
      }
    }
  });

  it("drifts far stars fastest, near stars slowest, as in StarfieldFX", () => {
    const durations = STAR_LAYERS.map((l) => l.duration);
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    expect(STAR_LAYERS.map((l) => l.size)).toEqual([1, 2, 3]);
  });

  it("shifts near stars most with the cursor, for depth", () => {
    const shifts = STAR_LAYERS.map((l) => l.parallax);
    expect(shifts).toEqual([...shifts].sort((a, b) => a - b));
    expect(new Set(shifts).size).toBe(shifts.length);
  });
});
