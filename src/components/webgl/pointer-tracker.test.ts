import { describe, expect, it } from "vitest";
import { createPointerTracker, POINTER_EASE_MS, pointerFollowAllowed } from "./pointer-tracker";

const frames = (tracker: ReturnType<typeof createPointerTracker>, ms: number) => {
  let state = tracker.step(0);
  for (let t = 0; t < ms; t += 16) state = tracker.step(16);
  return state;
};

describe("createPointerTracker", () => {
  it("rests at zero strength until the pointer arrives", () => {
    const tracker = createPointerTracker();
    expect(frames(tracker, 1000).strength).toBe(0);
    expect(tracker.resting).toBe(true);
  });

  it("starts at the pointer instead of sweeping in from the centre", () => {
    const tracker = createPointerTracker();
    tracker.move(0.9, 0.2);
    const state = tracker.step(16);
    expect(state.x).toBeCloseTo(0.9);
    expect(state.y).toBeCloseTo(0.2);
    expect(state.strength).toBeGreaterThan(0);
    expect(state.strength).toBeLessThan(0.2);
  });

  it("eases toward the pointer: about 63% of the way after one time constant, there after a few", () => {
    const tracker = createPointerTracker();
    tracker.move(0.2, 0.5);
    frames(tracker, 2000);
    tracker.move(0.8, 0.5);
    const partway = tracker.step(POINTER_EASE_MS);
    expect(partway.x).toBeCloseTo(0.2 + 0.6 * (1 - Math.exp(-1)), 5);
    expect(frames(tracker, POINTER_EASE_MS * 6).x).toBeCloseTo(0.8, 2);
  });

  it("is frame-rate independent", () => {
    const a = createPointerTracker();
    const b = createPointerTracker();
    a.move(0.5, 0.5);
    b.move(0.5, 0.5);
    for (let i = 0; i < 30; i++) a.step(16);
    for (let i = 0; i < 15; i++) b.step(32);
    expect(a.step(0).strength).toBeCloseTo(b.step(0).strength, 6);
  });

  it("fades out after the pointer leaves and comes to rest", () => {
    const tracker = createPointerTracker();
    tracker.move(0.5, 0.5);
    frames(tracker, 2000);
    tracker.leave();
    expect(tracker.step(100).strength).toBeGreaterThan(0.5);
    expect(frames(tracker, 4000).strength).toBe(0);
    expect(tracker.resting).toBe(true);
  });

  it("ignores negative time steps", () => {
    const tracker = createPointerTracker();
    tracker.move(0.5, 0.5);
    expect(tracker.step(-100).strength).toBe(0);
  });
});

describe("pointerFollowAllowed", () => {
  const media = (matching: string[]) => (query: string) => ({ matches: matching.includes(query) });
  const fine = "(hover: hover) and (pointer: fine)";
  const reduce = "(prefers-reduced-motion: reduce)";

  it("follows a mouse or trackpad", () => expect(pointerFollowAllowed(media([fine]))).toBe(true));
  it("does nothing on touch screens", () => expect(pointerFollowAllowed(media([]))).toBe(false));
  it("does nothing for reduced motion", () => expect(pointerFollowAllowed(media([fine, reduce]))).toBe(false));
});
