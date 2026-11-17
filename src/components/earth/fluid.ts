/**
 * A small stable-fluid simulation for the pointer wake over the Earth (after Jos Stam, "Stable Fluids", 1999).
 *
 * The grid covers the canvas, `width` × `height` cells (128 × 64 by default), x right and y up. A pointer move
 * splats velocity and displacement into it; each step advects the velocity through itself, damps it, adds
 * back the small swirls that coarse grids lose (vorticity confinement), and projects it to be divergence-free,
 * so the flow curls around the pointer instead of piling up. The displacement is carried along by the flow,
 * fed by it, and decays, so the picture is pushed, swirls, and settles back where it was.
 *
 * Velocity is in cells per second and displacement in cells. Plain typed arrays, no DOM, so it can be tested
 * and stepped anywhere.
 */

export const FLUID_WIDTH = 128;
export const FLUID_HEIGHT = 64;

/** Velocity and displacement are clamped to these, so a flick cannot tear the picture. */
export const MAX_VELOCITY = 30; // cells per second
export const MAX_DISPLACEMENT = 8; // cells

/** Time constants: how fast the velocity and the displacement die away (per second). */
const VELOCITY_DAMPING = 2.6;
const DISPLACEMENT_DECAY = 2.2;
/** Strength of the vorticity confinement. */
const VORTICITY = 1.5;
/** Jacobi iterations for the pressure solve. It starts from the previous step's pressure, so it converges over a few frames. */
const PRESSURE_ITERATIONS = 20;
/** Radius of a splat, in cells. */
const SPLAT_RADIUS = 5;
/** How much a splat adds: velocity per cell moved, and displacement per cell moved. */
const SPLAT_VELOCITY = 12;
const SPLAT_DISPLACEMENT = 0.3;
/** How much the flow feeds the displacement as it carries it (cells per cell/second, per second). */
const FLOW_TO_DISPLACEMENT = 0.35;
/** The longest step taken at once, so a slow frame cannot make the solver unstable. */
export const MAX_STEP = 1 / 30;

export type Fluid = {
  width: number;
  height: number;
  /**
   * Splats a pointer move: at (x, y) in 0..1 of the canvas (y up), moving by (dx, dy) in the same units since
   * the last splat.
   */
  splat: (x: number, y: number, dx: number, dy: number) => void;
  /** Advances by `dt` seconds (at most MAX_STEP). Returns the mean squared displacement, in cells². */
  step: (dt: number) => number;
  /**
   * Packs the displacement into `out` (width × height × 4 bytes, RGBA): red and green hold x and y around
   * 128, scaled so ±MAX_DISPLACEMENT is ±127.
   */
  pack: (out: Uint8Array) => void;
  /** Displacement at (x, y) in 0..1 of the canvas, in cells. */
  displacementAt: (x: number, y: number) => { x: number; y: number };
  /** Mean absolute divergence of the velocity: small after a step, since each step projects it. */
  divergence: () => number;
  /** The largest displacement anywhere, in cells: the wake has settled once this is a small fraction of a cell. */
  peak: () => number;
  /** Clears every field. */
  reset: () => void;
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function createFluid(width = FLUID_WIDTH, height = FLUID_HEIGHT): Fluid {
  const n = width * height;
  let vx = new Float32Array(n);
  let vy = new Float32Array(n);
  let vxNext = new Float32Array(n);
  let vyNext = new Float32Array(n);
  let dx = new Float32Array(n);
  let dy = new Float32Array(n);
  let dxNext = new Float32Array(n);
  let dyNext = new Float32Array(n);
  const curl = new Float32Array(n);
  const div = new Float32Array(n);
  let pressure = new Float32Array(n);
  let pressureNext = new Float32Array(n);

  const at = (x: number, y: number) => y * width + x;

  /** Bilinear sample of `field` at cell coordinates (x, y), clamped to the grid. */
  const sample = (field: Float32Array, x: number, y: number) => {
    x = clamp(x, 0, width - 1.001);
    y = clamp(y, 0, height - 1.001);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = at(x0, y0);
    return (field[i]! * (1 - fx) + field[i + 1]! * fx) * (1 - fy) + (field[i + width]! * (1 - fx) + field[i + width + 1]! * fx) * fy;
  };

  const splat: Fluid["splat"] = (x, y, mx, my) => {
    const cx = x * width - 0.5;
    const cy = y * height - 0.5;
    const cellsX = mx * width;
    const cellsY = my * height;
    const reach = Math.ceil(SPLAT_RADIUS * 2.5);
    for (let j = Math.max(1, Math.floor(cy - reach)); j <= Math.min(height - 2, Math.ceil(cy + reach)); j++) {
      for (let i = Math.max(1, Math.floor(cx - reach)); i <= Math.min(width - 2, Math.ceil(cx + reach)); i++) {
        const w = Math.exp(-((i - cx) ** 2 + (j - cy) ** 2) / (SPLAT_RADIUS * SPLAT_RADIUS));
        const k = at(i, j);
        vx[k] = clamp(vx[k]! + cellsX * SPLAT_VELOCITY * w, -MAX_VELOCITY, MAX_VELOCITY);
        vy[k] = clamp(vy[k]! + cellsY * SPLAT_VELOCITY * w, -MAX_VELOCITY, MAX_VELOCITY);
        dx[k] = clamp(dx[k]! + cellsX * SPLAT_DISPLACEMENT * w, -MAX_DISPLACEMENT, MAX_DISPLACEMENT);
        dy[k] = clamp(dy[k]! + cellsY * SPLAT_DISPLACEMENT * w, -MAX_DISPLACEMENT, MAX_DISPLACEMENT);
      }
    }
  };

  const computeDivergence = () => {
    let total = 0;
    for (let j = 1; j < height - 1; j++) {
      for (let i = 1; i < width - 1; i++) {
        const k = at(i, j);
        div[k] = 0.5 * (vx[k + 1]! - vx[k - 1]! + vy[k + width]! - vy[k - width]!);
        total += Math.abs(div[k]!);
      }
    }
    return total / ((width - 2) * (height - 2));
  };

  const step: Fluid["step"] = (dtIn) => {
    const dt = Math.min(Math.max(dtIn, 0), MAX_STEP);
    const damping = Math.exp(-VELOCITY_DAMPING * dt);
    const decay = Math.exp(-DISPLACEMENT_DECAY * dt);

    // 1. Advect the velocity through itself (trace each cell back along the flow), and damp it.
    for (let j = 1; j < height - 1; j++) {
      for (let i = 1; i < width - 1; i++) {
        const k = at(i, j);
        const x = i - vx[k]! * dt;
        const y = j - vy[k]! * dt;
        vxNext[k] = sample(vx, x, y) * damping;
        vyNext[k] = sample(vy, x, y) * damping;
      }
    }
    [vx, vxNext] = [vxNext, vx];
    [vy, vyNext] = [vyNext, vy];

    // 2. Vorticity confinement: push along the gradient of |curl|, so small swirls survive the coarse grid.
    for (let j = 1; j < height - 1; j++) {
      for (let i = 1; i < width - 1; i++) {
        const k = at(i, j);
        curl[k] = 0.5 * (vy[k + 1]! - vy[k - 1]! - vx[k + width]! + vx[k - width]!);
      }
    }
    for (let j = 2; j < height - 2; j++) {
      for (let i = 2; i < width - 2; i++) {
        const k = at(i, j);
        const gx = Math.abs(curl[k + 1]!) - Math.abs(curl[k - 1]!);
        const gy = Math.abs(curl[k + width]!) - Math.abs(curl[k - width]!);
        const length = Math.hypot(gx, gy) + 1e-5;
        vx[k] = vx[k]! + (gy / length) * curl[k]! * VORTICITY * dt;
        vy[k] = vy[k]! - (gx / length) * curl[k]! * VORTICITY * dt;
      }
    }

    // 3. Project: solve for the pressure that removes the divergence, and subtract its gradient. Divergence
    // and gradient both use central differences, so the Laplacian that matches them spans two cells.
    computeDivergence();
    for (let iteration = 0; iteration < PRESSURE_ITERATIONS; iteration++) {
      for (let j = 2; j < height - 2; j++) {
        for (let i = 2; i < width - 2; i++) {
          const k = at(i, j);
          pressureNext[k] =
            (pressure[k - 2]! + pressure[k + 2]! + pressure[k - 2 * width]! + pressure[k + 2 * width]! - 4 * div[k]!) * 0.25;
        }
      }
      [pressure, pressureNext] = [pressureNext, pressure];
    }
    for (let j = 1; j < height - 1; j++) {
      for (let i = 1; i < width - 1; i++) {
        const k = at(i, j);
        vx[k] = clamp(vx[k]! - 0.5 * (pressure[k + 1]! - pressure[k - 1]!), -MAX_VELOCITY, MAX_VELOCITY);
        vy[k] = clamp(vy[k]! - 0.5 * (pressure[k + width]! - pressure[k - width]!), -MAX_VELOCITY, MAX_VELOCITY);
      }
    }

    // 4. Carry the displacement along the flow, feed it from the flow, and let it decay.
    let energy = 0;
    for (let j = 1; j < height - 1; j++) {
      for (let i = 1; i < width - 1; i++) {
        const k = at(i, j);
        const x = i - vx[k]! * dt;
        const y = j - vy[k]! * dt;
        const nx = clamp((sample(dx, x, y) + vx[k]! * dt * FLOW_TO_DISPLACEMENT) * decay, -MAX_DISPLACEMENT, MAX_DISPLACEMENT);
        const ny = clamp((sample(dy, x, y) + vy[k]! * dt * FLOW_TO_DISPLACEMENT) * decay, -MAX_DISPLACEMENT, MAX_DISPLACEMENT);
        dxNext[k] = nx;
        dyNext[k] = ny;
        energy += nx * nx + ny * ny;
      }
    }
    [dx, dxNext] = [dxNext, dx];
    [dy, dyNext] = [dyNext, dy];
    return energy / n;
  };

  const pack: Fluid["pack"] = (out) => {
    for (let k = 0; k < n; k++) {
      out[k * 4] = clamp(Math.round(128 + (dx[k]! / MAX_DISPLACEMENT) * 127), 0, 255);
      out[k * 4 + 1] = clamp(Math.round(128 + (dy[k]! / MAX_DISPLACEMENT) * 127), 0, 255);
      out[k * 4 + 2] = 0;
      out[k * 4 + 3] = 255;
    }
  };

  const reset = () => {
    for (const field of [vx, vy, vxNext, vyNext, dx, dy, dxNext, dyNext, curl, div, pressure, pressureNext]) field.fill(0);
  };

  return {
    width,
    height,
    splat,
    step,
    pack,
    displacementAt: (x, y) => ({ x: sample(dx, x * width - 0.5, y * height - 0.5), y: sample(dy, x * width - 0.5, y * height - 0.5) }),
    divergence: computeDivergence,
    peak: () => {
      let max = 0;
      for (let k = 0; k < n; k++) max = Math.max(max, dx[k]! * dx[k]! + dy[k]! * dy[k]!);
      return Math.sqrt(max);
    },
    reset,
  };
}
