import { describe, expect, it } from "vitest";
import { HORIZON, horizonDistance, LANDMARKS, PLATE_ASPECT } from "./plate";
import {
  CALM_LIMB,
  CYCLONE_CYCLE,
  CYCLONE_INFLOW,
  CYCLONE_SPIN,
  FULL_MOTION,
  GLOW_BAND,
  glslFloat,
  horizonChunk,
  plateFragmentShader,
  swirlLayers,
  WAKE_BLUR,
  WAKE_GAIN,
} from "./plate-shader";

describe("glslFloat", () => {
  it("always writes a decimal point, so GLSL reads a float", () => {
    expect(glslFloat(2)).toBe("2.000000");
    expect(glslFloat(-1.61125)).toBe("-1.611250");
    expect(glslFloat(0)).toBe("0.000000");
  });
});

describe("plate shader", () => {
  it("draws the limb with the same cubic as plate.ts", () => {
    for (const coefficient of HORIZON) expect(horizonChunk).toContain(glslFloat(coefficient));
    expect(horizonChunk).toContain(`const float PLATE_ASPECT = ${glslFloat(PLATE_ASPECT)};`);
  });

  it("turns the cyclone around the painted eye and calms the bands over the symbol", () => {
    const { cyclone, symbol } = LANDMARKS;
    expect(plateFragmentShader).toContain(
      `const vec2 CYCLONE = vec2(${glslFloat(cyclone.u * PLATE_ASPECT)}, ${glslFloat(cyclone.v)});`,
    );
    expect(plateFragmentShader).toContain(`const float CYCLONE_REACH = ${glslFloat(cyclone.radius)};`);
    expect(plateFragmentShader).toContain(
      `const vec2 SYMBOL = vec2(${glslFloat(symbol.u * PLATE_ASPECT)}, ${glslFloat(symbol.v)});`,
    );
  });

  it("writes every uniform the scene sets", () => {
    for (const name of ["uPlate", "uPlateRect", "uResolution", "uReady", "uSky", "uTime", "uFlow"]) {
      expect(plateFragmentShader).toMatch(new RegExp(`uniform \\w+ ${name};`));
    }
  });
});

describe("motion and glow bands", () => {
  it("ease motion in over a band just inside the limb", () => {
    expect(CALM_LIMB).toBeGreaterThan(0);
    expect(FULL_MOTION).toBeGreaterThan(CALM_LIMB);
  });

  it("give the cyclone and the symbol full motion: both lie deeper than the easing band", () => {
    const { cyclone, symbol } = LANDMARKS;
    expect(horizonDistance(cyclone.u, cyclone.v)).toBeGreaterThan(FULL_MOTION);
    expect(horizonDistance(symbol.u, symbol.v)).toBeGreaterThan(FULL_MOTION);
  });

  it("keep the painted glow around the sunrise, which sits within the glow band of the limb", () => {
    expect(GLOW_BAND).toBeGreaterThan(0);
    expect(Math.abs(horizonDistance(LANDMARKS.sunrise.u, LANDMARKS.sunrise.v))).toBeLessThan(GLOW_BAND + FULL_MOTION);
  });
});

describe("cyclone swirl", () => {
  it("crossfades two layers whose weights always add up to 1", () => {
    for (let t = 0; t < CYCLONE_CYCLE * 3; t += 0.137) {
      const [a, b] = swirlLayers(t);
      expect(a.weight + b.weight).toBeCloseTo(1, 9);
      expect(Math.abs(a.phase - b.phase)).toBeCloseTo(0.5, 9);
    }
  });

  it("hides each layer's restart: a layer has no weight as it starts again, full weight halfway", () => {
    const [atRestart] = swirlLayers(0);
    expect(atRestart.phase).toBe(0);
    expect(atRestart.weight).toBe(0);
    const [halfway] = swirlLayers(CYCLONE_CYCLE / 2);
    expect(halfway.weight).toBeCloseTo(1, 9);
  });

  it("keeps each layer's turn small, so the crossfaded layers barely differ", () => {
    // Half a cycle either side of a layer's middle, at the eye.
    expect(CYCLONE_SPIN * (CYCLONE_CYCLE / 2)).toBeLessThan(0.35);
    expect(CYCLONE_INFLOW * (CYCLONE_CYCLE / 2)).toBeLessThan(0.1);
  });

  it("writes the swirl into the shader and no longer rocks the storm", () => {
    expect(plateFragmentShader).toContain(`const float CYCLONE_SPIN = ${glslFloat(CYCLONE_SPIN)};`);
    expect(plateFragmentShader).toContain("vec2 swirl(vec2 q, float phase)");
    expect(plateFragmentShader).not.toContain("sin(uTime * 0.16)");
  });
});

describe("pointer wake", () => {
  it("pushes the clouds a few pixels at most, through a blur wider than a cell", () => {
    expect(WAKE_GAIN).toBeGreaterThan(0);
    expect(WAKE_GAIN).toBeLessThanOrEqual(0.35);
    expect(WAKE_BLUR).toBeGreaterThanOrEqual(1);
    expect(plateFragmentShader).toContain(`const float WAKE_GAIN = ${glslFloat(WAKE_GAIN)};`);
    expect(plateFragmentShader).toContain(`const float WAKE_BLUR = ${glslFloat(WAKE_BLUR)};`);
  });

  it("moves the cloud symbol as one piece: over the symbol the wake is the wake averaged across it", () => {
    expect(plateFragmentShader).toContain("vec2 wake(vec2 q)");
    expect(plateFragmentShader).toContain("return mix(local, whole, calm);");
    expect(plateFragmentShader).toContain("- wake(q)");
  });
});
