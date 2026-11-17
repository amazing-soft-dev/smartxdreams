import { describe, expect, it } from "vitest";
import { EARTH_IGNORE_SELECTOR, EARTH_POINTER_QUERY, isOnEarth, splatCount } from "./earth-pointer";
import { horizonV, LANDMARKS } from "./plate";
import { plateBreakpointFor, plateRect, plateToHero } from "./plate-layout";

const rect = plateRect(plateBreakpointFor(1475).symbol, 2);

describe("isOnEarth", () => {
  it("is true over the planet: the cloud symbol and the cyclone", () => {
    const symbol = plateToHero(rect, LANDMARKS.symbol.u, LANDMARKS.symbol.v);
    const cyclone = plateToHero(rect, LANDMARKS.cyclone.u, LANDMARKS.cyclone.v);
    expect(isOnEarth(rect, symbol.x, symbol.y)).toBe(true);
    expect(isOnEarth(rect, cyclone.x, cyclone.y)).toBe(true);
  });

  it("is false in the sky, where the copy sits", () => {
    expect(isOnEarth(rect, 0.1, 0.9)).toBe(false);
    expect(isOnEarth(rect, 0.4, 0.95)).toBe(false);
  });

  it("is false in the still band just inside the limb, and true past it", () => {
    const u = 0.6;
    const atLimb = plateToHero(rect, u, horizonV(u) + 0.005);
    const deeper = plateToHero(rect, u, horizonV(u) + 0.08);
    expect(isOnEarth(rect, atLimb.x, atLimb.y)).toBe(false);
    expect(isOnEarth(rect, deeper.x, deeper.y)).toBe(true);
  });

  it("is false off the plate", () => {
    expect(isOnEarth(rect, rect.left - 0.1, 0.1)).toBe(false);
  });
});

describe("splatCount", () => {
  it("breaks a move into steps of at most 10 px", () => {
    expect(splatCount(0, 0)).toBe(1);
    expect(splatCount(9, 0)).toBe(1);
    expect(splatCount(30, 40)).toBe(5);
  });

  it("never splats more than 16 times for one move", () => {
    expect(splatCount(5000, 0)).toBe(16);
  });
});

describe("gates", () => {
  it("ignore the page's controls and take only fine pointers that hover", () => {
    for (const selector of ["a", "button", "input", "select"]) expect(EARTH_IGNORE_SELECTOR).toContain(selector);
    expect(EARTH_POINTER_QUERY).toBe("(hover: hover) and (pointer: fine)");
  });
});
