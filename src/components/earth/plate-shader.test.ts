import { describe, expect, it } from "vitest";
import { HORIZON, horizonDistance, LANDMARKS, PLATE_ASPECT } from "./plate";
import { CALM_LIMB, FULL_MOTION, GLOW_BAND, glslFloat, horizonChunk, plateFragmentShader } from "./plate-shader";

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
    for (const name of ["uPlate", "uPlateRect", "uResolution", "uReady", "uSky", "uTime"]) {
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
