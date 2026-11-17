import { describe, expect, it } from "vitest";
import { createWake, gustEnvelope, WAKE_GUSTS, WAKE_MAX_PUSH, WAKE_SPACING } from "./wake";

const buffer = () => new Float32Array(WAKE_GUSTS * 4);
const pushes = (out: Float32Array) =>
  Array.from({ length: WAKE_GUSTS }, (_, i) => Math.hypot(out[i * 4 + 2]!, out[i * 4 + 3]!));

describe("gustEnvelope", () => {
  it("is zero before a gust is made and for a gust that was never made", () => {
    expect(gustEnvelope(-0.1)).toBe(0);
    expect(gustEnvelope(Infinity)).toBe(0);
  });

  it("rises quickly, then settles within about two seconds", () => {
    expect(gustEnvelope(0)).toBe(0);
    expect(gustEnvelope(0.2)).toBeGreaterThan(0.5);
    expect(gustEnvelope(2)).toBeLessThan(0.03);
  });
});

describe("createWake", () => {
  it("leaves no gust on the first move, only a starting point", () => {
    const wake = createWake();
    wake.move(0.5, 0.5, 0);
    const out = buffer();
    expect(wake.write(0.2, out)).toBe(false);
  });

  it("ignores moves shorter than the spacing", () => {
    const wake = createWake();
    wake.move(0.5, 0.5, 0);
    wake.move(0.5 + WAKE_SPACING / 2, 0.5, 0.016);
    expect(wake.write(0.2, buffer())).toBe(false);
  });

  it("pushes along the pointer's direction, between its last two positions", () => {
    const wake = createWake();
    wake.move(0.5, 0.5, 0);
    wake.move(0.52, 0.5, 0.05);
    const out = buffer();
    expect(wake.write(0.25, out)).toBe(true);
    expect(out[0]).toBeCloseTo(0.51, 6);
    expect(out[1]).toBeCloseTo(0.5, 6);
    expect(out[2]).toBeGreaterThan(0);
    expect(out[3]).toBeCloseTo(0, 9);
  });

  it("caps the push of a fast flick", () => {
    const wake = createWake();
    wake.move(0, 0, 0);
    wake.move(1, 0, 0.001);
    const out = buffer();
    wake.write(0.1, out);
    expect(Math.max(...pushes(out))).toBeLessThanOrEqual(WAKE_MAX_PUSH + 1e-9);
  });

  it("lets the clouds settle back once the pointer stops", () => {
    const wake = createWake();
    wake.move(0.5, 0.5, 0);
    wake.move(0.53, 0.5, 0.05);
    expect(wake.write(0.3, buffer())).toBe(true);
    expect(wake.write(4, buffer())).toBe(false);
  });

  it("keeps the newest gusts when the trail is longer than the buffer", () => {
    const wake = createWake();
    for (let i = 0; i <= WAKE_GUSTS + 2; i++) wake.move(i * 0.02, 0, i * 0.016);
    const out = buffer();
    wake.write(0.3, out);
    const xs = Array.from({ length: WAKE_GUSTS }, (_, i) => out[i * 4]!);
    // The two oldest gusts (around x = 0.01 and 0.03) were replaced.
    expect(Math.min(...xs)).toBeGreaterThan(0.04);
  });

  it("starts a fresh trail after leaving, instead of jumping from the old position", () => {
    const wake = createWake();
    wake.move(0.1, 0.1, 0);
    wake.leave();
    wake.move(0.9, 0.9, 0.05);
    expect(wake.write(0.2, buffer())).toBe(false);
  });
});
