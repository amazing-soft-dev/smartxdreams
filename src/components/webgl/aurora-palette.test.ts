import { describe, expect, it } from "vitest";
import { AURORA_CYCLE_SECONDS, AURORA_STOPS, auroraPalette, hexToRgb, mixLinear } from "./aurora-palette";

const distance = (a: readonly number[], b: readonly number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i]!)));

describe("auroraPalette", () => {
  it("starts on the first stop's brand colours", () => {
    const { low, high } = auroraPalette(0);
    expect(distance(low, hexToRgb(AURORA_STOPS[0]!.low))).toBeLessThan(1e-9);
    expect(distance(high, hexToRgb(AURORA_STOPS[0]!.high))).toBeLessThan(1e-9);
  });

  it("holds each stop's brand colours at the start of its slot", () => {
    const slot = AURORA_CYCLE_SECONDS / AURORA_STOPS.length;
    AURORA_STOPS.forEach((stop, i) => {
      const { low, high } = auroraPalette(i * slot + 0.01);
      expect(distance(low, hexToRgb(stop.low))).toBeLessThan(1e-9);
      expect(distance(high, hexToRgb(stop.high))).toBeLessThan(1e-9);
    });
  });

  it("loops: the end of the cycle meets its start, and negative time wraps", () => {
    expect(distance(auroraPalette(AURORA_CYCLE_SECONDS).low, auroraPalette(0).low)).toBeLessThan(1e-9);
    expect(distance(auroraPalette(AURORA_CYCLE_SECONDS - 1e-6).high, auroraPalette(0).high)).toBeLessThan(1e-4);
    expect(distance(auroraPalette(-5).low, auroraPalette(AURORA_CYCLE_SECONDS - 5).low)).toBeLessThan(1e-9);
  });

  it("changes smoothly: no jump between frames anywhere in the loop", () => {
    const frame = 1 / 60;
    let worst = 0;
    for (let s = 0; s < AURORA_CYCLE_SECONDS * 2; s += frame) {
      const a = auroraPalette(s);
      const b = auroraPalette(s + frame);
      worst = Math.max(worst, distance(a.low, b.low), distance(a.high, b.high));
    }
    expect(worst).toBeLessThan(0.01);
  });

  it("stays inside 0-1", () => {
    for (let s = 0; s < AURORA_CYCLE_SECONDS; s += 0.1) {
      const { low, high } = auroraPalette(s);
      for (const c of [...low, ...high]) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("mixLinear", () => {
  it("keeps the midpoint brighter than a plain sRGB average", () => {
    const mid = mixLinear([1, 0, 0], [0, 0, 1], 0.5);
    expect(mid[0]).toBeGreaterThan(0.5);
    expect(mid[2]).toBeGreaterThan(0.5);
  });
});
