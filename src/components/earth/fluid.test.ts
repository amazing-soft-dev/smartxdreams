import { describe, expect, it } from "vitest";
import {
  createFluid,
  EDDY_OFFSET,
  EDDY_RADIUS,
  EDDY_VELOCITY,
  FLUID_HEIGHT,
  FLUID_MAX_HEIGHT,
  FLUID_MIN_HEIGHT,
  FLUID_WIDTH,
  fluidGridFor,
  MAX_DISPLACEMENT,
  MAX_STEP,
} from "./fluid";

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

  it("bends the picture smoothly: no cell's displacement jumps far from its neighbour's after a quick sweep", () => {
    const fluid = createFluid();
    // A quick diagonal sweep across a third of the canvas, as a mouse flicked over the clouds.
    for (let i = 0; i < 24; i++) fluid.splat(0.3 + i * 0.012, 0.35 + i * 0.008, 0.012, 0.008);
    let steepest = 0;
    for (let t = 0; t < 0.5; t += 1 / 60) {
      fluid.step(1 / 60);
      for (let y = 0; y < FLUID_HEIGHT - 1; y++) {
        for (let x = 0; x < FLUID_WIDTH - 1; x++) {
          const at = (cx: number, cy: number) => fluid.displacementAt((cx + 0.5) / FLUID_WIDTH, (cy + 0.5) / FLUID_HEIGHT);
          const here = at(x, y);
          for (const next of [at(x + 1, y), at(x, y + 1)]) {
            steepest = Math.max(steepest, Math.hypot(next.x - here.x, next.y - here.y));
          }
        }
      }
    }
    // Under a cell per cell, so neighbouring clouds move together instead of tearing into streaks.
    expect(steepest).toBeLessThan(0.8);
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

describe("eddies", () => {
  /** A short rightward sweep through the middle, then a little time for the flow to carry the picture. */
  function sweep() {
    const fluid = createFluid();
    for (let i = 0; i < 12; i++) fluid.splat(0.4 + i * 0.006, 0.5, 0.006, 0);
    run(fluid, 0.4);
    return fluid;
  }
  const x = 0.4 + 6 * 0.006;
  const row = (cells: number) => 0.5 + cells / FLUID_HEIGHT;

  it("push the clouds along the path and curl them back on both sides", () => {
    const fluid = sweep();
    expect(fluid.displacementAt(x, row(0)).x).toBeGreaterThan(1);
    // Past the eddies' centres, on either side, the clouds come back against the stroke.
    expect(fluid.displacementAt(x, row(EDDY_OFFSET + 6)).x).toBeLessThan(-0.3);
    expect(fluid.displacementAt(x, row(-(EDDY_OFFSET + 6))).x).toBeLessThan(-0.3);
  });

  it("turn opposite ways, so the wake is mirror-symmetric about the path", () => {
    const fluid = sweep();
    for (const cells of [4, 8, 14, 20]) {
      const above = fluid.displacementAt(x, row(cells));
      const below = fluid.displacementAt(x, row(-cells));
      expect(above.x).toBeCloseTo(below.x, 1);
      expect(above.y).toBeCloseTo(-below.y, 1);
    }
  });

  it("settle back with the rest of the wake", () => {
    const fluid = sweep();
    run(fluid, 3);
    expect(fluid.peak()).toBeLessThan(0.1);
  });

  it("add nothing for a pointer that does not move", () => {
    const fluid = createFluid();
    fluid.splat(0.5, 0.5, 0, 0);
    expect(fluid.peak()).toBe(0);
    expect(fluid.step(1 / 60)).toBe(0);
  });

  it("are broader than a splat and sit beside it", () => {
    expect(EDDY_RADIUS).toBeGreaterThan(5);
    expect(EDDY_OFFSET).toBeGreaterThanOrEqual(EDDY_RADIUS);
    expect(EDDY_VELOCITY).toBeGreaterThan(0);
  });
});

describe("fluidGridFor", () => {
  it("keeps the cells square: 128 columns and as many rows as the canvas's shape needs", () => {
    expect(fluidGridFor(1460, 730)).toEqual({ width: 128, height: 64 });
    expect(fluidGridFor(1024, 768)).toEqual({ width: 128, height: 96 });
    expect(fluidGridFor(3440, 1476)).toEqual({ width: 128, height: 55 });
  });

  it("stays within its row limits for extreme shapes, and falls back for an empty canvas", () => {
    expect(fluidGridFor(5120, 1000).height).toBe(FLUID_MIN_HEIGHT);
    expect(fluidGridFor(500, 2000).height).toBe(FLUID_MAX_HEIGHT);
    expect(fluidGridFor(0, 0)).toEqual({ width: FLUID_WIDTH, height: FLUID_HEIGHT });
  });

  it("gives a grid the solver runs on: a square-celled wake still settles", () => {
    const { width, height } = fluidGridFor(1024, 768);
    const fluid = createFluid(width, height);
    for (let i = 0; i < 10; i++) fluid.splat(0.4 + i * 0.01, 0.5, 0.01, 0);
    run(fluid, 3);
    expect(fluid.peak()).toBeLessThan(0.1);
    expect(fluid.divergence()).toBeLessThan(0.5);
  });
});
