import { describe, expect, it } from "vitest";
import { PLATE_ASPECT } from "./plate";
import {
  CURRENT_DRIFT,
  CURRENT_EASE_IN,
  CURRENT_EVOLVE,
  CURRENT_SCALE,
  CURRENT_STEP,
  CURRENT_STRENGTH,
  currentEase,
  currentsAt,
  currentStream,
  glslFloat,
  hash13,
  noise3,
  plateFragmentShader,
} from "./plate-shader";

/** Plate heights per master pixel. */
const PX = 1 / 948;

/** Points over the whole plate (x up to PLATE_ASPECT, y 0..1), every `step` plate heights. */
function* grid(step: number) {
  for (let x = 0.02; x < PLATE_ASPECT; x += step) for (let y = 0.02; y < 1; y += step) yield [x, y] as const;
}

describe("noise", () => {
  it("hashes to 0..1 and noise3 stays in 0..1", () => {
    for (let i = 0; i < 500; i++) {
      const h = hash13(i * 1.7, i * 0.3, i * 2.9);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      const n = noise3(i * 0.37, i * 0.11, i * 0.05);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
  });

  it("is smooth: nearby points have nearby values", () => {
    for (const [x, y] of grid(0.1)) expect(Math.abs(noise3(x, y, 1) - noise3(x + 0.001, y, 1))).toBeLessThan(0.01);
  });
});

describe("ambient currents", () => {
  it("are divergence-free: the clouds stream past each other without bunching up or thinning out", () => {
    // The curl of a stream function has no divergence. Measured with a step much smaller than the field's,
    // what is left is tiny next to the currents' own gradients.
    const h = CURRENT_STEP / 4;
    let divergence = 0;
    let gradient = 0;
    for (const [x, y] of grid(0.09)) {
      const dxdx = (currentsAt(x + h, y, 7).x - currentsAt(x - h, y, 7).x) / (2 * h);
      const dydy = (currentsAt(x, y + h, 7).y - currentsAt(x, y - h, 7).y) / (2 * h);
      const dxdy = (currentsAt(x, y + h, 7).x - currentsAt(x, y - h, 7).x) / (2 * h);
      divergence = Math.max(divergence, Math.abs(dxdx + dydy));
      gradient = Math.max(gradient, Math.abs(dxdx), Math.abs(dydy), Math.abs(dxdy));
    }
    expect(divergence).toBeLessThan(gradient * 0.05);
  });

  it("move the plate a few pixels at most, wherever and whenever", () => {
    let largest = 0;
    let total = 0;
    let n = 0;
    for (let t = 0; t < 300; t += 17) {
      for (const [x, y] of grid(0.03)) {
        const c = currentsAt(x, y, t);
        const m = Math.hypot(c.x, c.y);
        largest = Math.max(largest, m);
        total += m;
        n++;
      }
    }
    expect(largest / PX).toBeLessThan(16);
    expect(largest / PX).toBeGreaterThan(6);
    expect(total / n / PX).toBeGreaterThan(2);
  });

  it("change over a few seconds, so the clouds visibly flow with no pointer", () => {
    let changed = 0;
    let n = 0;
    for (const [x, y] of grid(0.05)) {
      const a = currentsAt(x, y, 10);
      const b = currentsAt(x, y, 13);
      changed += Math.hypot(a.x - b.x, a.y - b.y);
      n++;
    }
    expect(changed / n / PX).toBeGreaterThan(1);
  });

  it("are bounded, so after any time nothing has smeared: the field only drifts and turns", () => {
    for (const t of [0, 60, 600, 6000]) {
      for (const [x, y] of grid(0.2)) {
        const c = currentsAt(x, y, t);
        expect(Math.hypot(c.x, c.y)).toBeLessThan(0.02);
      }
    }
  });

  it("are broad: a few currents across the planet, not a ripple", () => {
    expect(CURRENT_SCALE).toBeGreaterThan(1);
    expect(CURRENT_SCALE).toBeLessThan(5);
    expect(CURRENT_STEP * CURRENT_SCALE).toBeLessThan(0.1);
    expect(Math.hypot(...CURRENT_DRIFT)).toBeGreaterThan(0);
    expect(CURRENT_EVOLVE).toBeGreaterThan(0);
  });

  it("are written into the shader with the same constants and the same curl", () => {
    expect(plateFragmentShader).toContain(`const float CURRENT_SCALE = ${glslFloat(CURRENT_SCALE)};`);
    expect(plateFragmentShader).toContain(`const vec2 CURRENT_DRIFT = vec2(${glslFloat(CURRENT_DRIFT[0])}, ${glslFloat(CURRENT_DRIFT[1])});`);
    expect(plateFragmentShader).toContain(`const float CURRENT_EVOLVE = ${glslFloat(CURRENT_EVOLVE)};`);
    expect(plateFragmentShader).toContain(`const float CURRENT_STRENGTH = ${glslFloat(CURRENT_STRENGTH)};`);
    expect(plateFragmentShader).toContain("noise3(vec3(q * CURRENT_SCALE - CURRENT_DRIFT * uTime, uTime * CURRENT_EVOLVE))");
    expect(plateFragmentShader).toContain("stream(q + e.yx) - stream(q - e.yx), stream(q - e) - stream(q + e)");
    expect(currentStream(0.5, 0.5, 0)).toBeCloseTo(noise3(0.5 * CURRENT_SCALE, 0.5 * CURRENT_SCALE, 0), 12);
  });

  it("carry the emblem whole, by the larger of its ellipse and its mask, and calm the weather over it", () => {
    expect(plateFragmentShader).toMatch(/float emblemWhole\(vec2 q\) \{\s*return max\(symbolCalm\(q\), emblemAt\(q\)\);/);
    expect(plateFragmentShader).toMatch(/vec2 emblemSafeCurrents\(vec2 q\)[\s\S]*currents\(SYMBOL\)[\s\S]*mix\(currents\(q\), centre, whole\)/);
    expect(plateFragmentShader).toContain("+ emblemSafeCurrents(q) - wake(q)");
    expect(plateFragmentShader).toContain("bands * patches * (1.0 - emblemWhole(q))");
  });

  it("are declared before the shader uses them (GLSL needs it)", () => {
    const order = ["float emblemAt(", "float emblemWhole(", "vec2 weather(", "vec2 currents(", "vec2 emblemSafeCurrents(", "vec2 sharedMotion("];
    const at = order.map((name) => plateFragmentShader.indexOf(name));
    for (const i of at) expect(i).toBeGreaterThan(0);
    for (let k = 1; k < at.length; k++) expect(at[k]).toBeGreaterThan(at[k - 1]!);
  });

  it("skip every pixel that cannot move: the calm band and outside the limb", () => {
    expect(plateFragmentShader).toMatch(/vec3 movedColor\(vec2 q, float dist\) \{[\s\S]{0,400}if \(dist <= CALM_LIMB\) return plateColor/);
  });
});

describe("the scene's first frame", () => {
  it("has no currents yet, so the scene fades in exactly over the still fallback", () => {
    expect(currentEase(0)).toBe(0);
    for (const [x, y] of grid(0.2)) {
      const c = currentsAt(x, y, 0);
      expect(Math.hypot(c.x, c.y)).toBe(0);
    }
  });

  it("brings the currents in smoothly over the first seconds, then leaves them whole", () => {
    let last = 0;
    for (let t = 0; t <= CURRENT_EASE_IN; t += 0.25) {
      expect(currentEase(t)).toBeGreaterThanOrEqual(last);
      last = currentEase(t);
    }
    expect(currentEase(CURRENT_EASE_IN)).toBe(1);
    expect(currentEase(600)).toBe(1);
    // Still small while the scene fades in (700 ms).
    expect(currentEase(0.7)).toBeLessThan(0.1);
  });

  it("starts every other motion from zero too", () => {
    // Drift and weather are sines measured from t = 0; the breath is a sine from zero; the cyclone's first
    // layer has no weight and its second is untouched at its middle.
    expect(plateFragmentShader).toContain("vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043))");
    expect(plateFragmentShader).toContain("sin(uTime * 0.22 + q.y * 3.0) - sin(q.y * 3.0)");
    expect(plateFragmentShader).toContain("CYCLONE_BREATH * sin(TAU * uTime / CYCLONE_BREATH_PERIOD)");
    expect(plateFragmentShader).toContain("smoothstep(0.0, CURRENT_EASE_IN, uTime)");
    expect(plateFragmentShader).toContain(`const float CURRENT_EASE_IN = ${glslFloat(CURRENT_EASE_IN)};`);
  });
});
