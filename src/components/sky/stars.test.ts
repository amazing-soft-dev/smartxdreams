import { describe, expect, it } from "vitest";
import {
  createStars,
  DEPTH_LAYERS,
  depthLayer,
  layerDepth,
  STAR_COLORS,
  STAR_COUNT,
  STAR_DEPTH,
  STAR_SIZE,
  TWINKLE_MAX_DELAY,
} from "./stars";

describe("createStars", () => {
  it("makes the reference's 200 stars by default", () => {
    expect(createStars()).toHaveLength(STAR_COUNT);
    expect(STAR_COUNT).toBe(200);
  });

  it("gives the same sky for the same seed, so server and client markup match", () => {
    expect(createStars()).toEqual(createStars());
    expect(createStars({ seed: 7 })).toEqual(createStars({ seed: 7 }));
  });

  it("gives a different sky for a different seed", () => {
    expect(createStars({ seed: 1 })).not.toEqual(createStars({ seed: 2 }));
  });

  it("keeps every star inside the reference ranges", () => {
    for (const star of createStars()) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(100);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(100);
      expect(star.size).toBeGreaterThanOrEqual(STAR_SIZE.min);
      expect(star.size).toBeLessThanOrEqual(STAR_SIZE.max);
      expect(star.depth).toBeGreaterThanOrEqual(STAR_DEPTH.min);
      expect(star.depth).toBeLessThanOrEqual(STAR_DEPTH.max);
      expect(star.delay).toBeGreaterThanOrEqual(0);
      expect(star.delay).toBeLessThanOrEqual(TWINKLE_MAX_DELAY);
      expect(STAR_COLORS).toContain(star.color);
      expect(star.layer).toBe(depthLayer(star.depth));
    }
  });

  it("numbers the stars in order", () => {
    expect(createStars({ count: 5 }).map((star) => star.i)).toEqual([0, 1, 2, 3, 4]);
  });

  it("uses both colours and every depth layer", () => {
    const stars = createStars();
    expect(new Set(stars.map((star) => star.color)).size).toBe(STAR_COLORS.length);
    expect(new Set(stars.map((star) => star.layer)).size).toBe(DEPTH_LAYERS);
  });

  it("spreads the stars over the whole sky", () => {
    const stars = createStars();
    const quadrants = new Set(stars.map((star) => `${star.x < 50}${star.y < 50}`));
    expect(quadrants.size).toBe(4);
  });
});

describe("depth layers", () => {
  it("splits the depth range into equal slices", () => {
    expect(depthLayer(STAR_DEPTH.min)).toBe(0);
    expect(depthLayer(0.4)).toBe(0);
    expect(depthLayer(0.5)).toBe(1);
    expect(depthLayer(0.8)).toBe(2);
    expect(depthLayer(STAR_DEPTH.max)).toBe(DEPTH_LAYERS - 1);
  });

  it("moves each layer at the depth in the middle of its slice", () => {
    for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
      expect(depthLayer(layerDepth(layer))).toBe(layer);
    }
    expect(layerDepth(0)).toBeCloseTo(0.2 + 0.8 / 6);
    expect(layerDepth(DEPTH_LAYERS - 1)).toBeCloseTo(1 - 0.8 / 6);
  });
});
