import { describe, expect, it } from "vitest";
import { createFluid, FLUID_HEIGHT, FLUID_WIDTH, MAX_DISPLACEMENT, MAX_STEP } from "./fluid";

/** A pointer dragged right across the middle of the canvas in ten moves. */
function dragRight(fluid: ReturnType<typeof createFluid>) {
  for (let i = 0; i < 10; i++) fluid.splat(0.4 + i * 0.01, 0.5, 0.01, 0);
}

const run = (fluid: ReturnType<typeof createFluid>, seconds: number, dt = 1 / 60) => {
  let energy = 0;
  for (let t = 0; t < seconds; t += dt) energy = fluid.step(dt);
  return energy;
};

describe("createFluid", () => {
  it("starts still", () => {
    const fluid = createFluid();
    expect(fluid.width).toBe(FLUID_WIDTH);
    expect(fluid.height).toBe(FLUID_HEIGHT);
    expect(fluid.step(1 / 60)).toBe(0);
  });

  it("pushes the picture along the pointer's direction", () => {
    const fluid = createFluid();
    dragRight(fluid);
    fluid.step(1 / 60);
    const d = fluid.displacementAt(0.45, 0.5);
    expect(d.x).toBeGreaterThan(0.1);
    expect(Math.abs(d.y)).toBeLessThan(d.x);
  });

  it("projects the flow so it curls instead of piling up", () => {
    const fluid = createFluid();
    dragRight(fluid);
    const before = fluid.divergence();
    fluid.step(1 / 60);
    // divergence() measures the projected velocity the step left behind. One cold step removes about a
    // third; the solve starts from the last pressure, so it keeps improving over the next frames.
    expect(fluid.divergence()).toBeLessThan(before * 0.8);
  });

  it("pushes no further than a few cells, and settles back within about two and a half seconds", () => {
    const fluid = createFluid();
    dragRight(fluid);
    let highest = 0;
    for (let t = 0; t < 0.6; t += 1 / 60) {
      fluid.step(1 / 60);
      highest = Math.max(highest, fluid.peak());
    }
    expect(highest).toBeGreaterThan(1);
    expect(highest).toBeLessThan(4);
    run(fluid, 1.9);
    // A tenth of a cell is well under a pixel on screen.
    expect(fluid.peak()).toBeLessThan(0.12);
  });

  it("stays finite and bounded at the longest step, even after a violent flick", () => {
    const fluid = createFluid();
    for (let i = 0; i < 30; i++) fluid.splat(0.1 + i * 0.03, 0.3 + (i % 5) * 0.08, 0.3, -0.2);
    for (let i = 0; i < 120; i++) {
      const energy = fluid.step(1);
      expect(Number.isFinite(energy)).toBe(true);
      expect(energy).toBeLessThanOrEqual(2 * MAX_DISPLACEMENT * MAX_DISPLACEMENT);
    }
    expect(MAX_STEP).toBeLessThanOrEqual(1 / 30);
  });

  it("packs the displacement around 128, opaque", () => {
    const fluid = createFluid(8, 8);
    const out = new Uint8Array(8 * 8 * 4);
    fluid.pack(out);
    expect(out[0]).toBe(128);
    expect(out[1]).toBe(128);
    expect(out[3]).toBe(255);
    fluid.splat(0.5, 0.5, 0.5, 0);
    fluid.pack(out);
    expect(Math.max(...Array.from({ length: 64 }, (_, k) => out[k * 4]!))).toBeGreaterThan(128);
  });

  it("clears everything on reset", () => {
    const fluid = createFluid();
    dragRight(fluid);
    fluid.reset();
    expect(fluid.step(1 / 60)).toBe(0);
  });
});
