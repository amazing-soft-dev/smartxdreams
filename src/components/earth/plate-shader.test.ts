import { describe, expect, it } from "vitest";
import { GLOW_EDGE, GLOW_RISE, glowCoverage, glowFade, HORIZON, horizonDistance, LANDMARKS, PLATE_ASPECT, SKY_FLOOR } from "./plate";
import {
  CALM_LIMB,
  CYCLONE_CORE,
  CYCLONE_SWAY,
  CYCLONE_SWAY_RATE,
  CYCLONE_TURN,
  CYCLONE_TURN_RATE,
  cycloneAngle,
  cycloneBody,
  FULL_MOTION,
  GLOW_BAND,
  glslFloat,
  horizonChunk,
  plateFragmentShader,
  WAKE_BLUR,
  WAKE_GAIN,
} from "./plate-shader";

/** Plate heights per master pixel. */
const PX = 1 / 948;

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
    for (const name of ["uPlate", "uPlateRect", "uResolution", "uReady", "uSky", "uTime", "uFlow", "uFlowCells", "uEmblem"]) {
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

  it("reach the high streaks, about 0.115 plate heights over the rim", () => {
    expect(GLOW_BAND).toBeGreaterThanOrEqual(0.115);
    expect(GLOW_EDGE).toBeLessThan(GLOW_BAND / 4);
  });
});

describe("glow coverage", () => {
  it("counts no glow in the painted navy sky, even where its haze is bright blue", () => {
    // Far out (red and green under 0.1) and in the haze just over the rim (blue up to 0.75, green ~0.09).
    expect(glowCoverage(0.02, 0.07)).toBe(0);
    expect(glowCoverage(0.02, 0.09)).toBe(0);
  });

  it("counts the cyan rim, the sunrise and the pink streaks", () => {
    expect(glowCoverage(0.35, 0.64)).toBe(1); // rim
    expect(glowCoverage(0.75, 0.46)).toBe(1); // sunrise
    expect(glowCoverage(0.24, 0.25)).toBeGreaterThan(0.2); // a streak 40 px out
  });

  it("rises with brightness and never leaves 0..1", () => {
    let last = 0;
    for (let x = 0; x <= 1; x += 0.05) {
      const c = glowCoverage(x, 0);
      expect(c).toBeGreaterThanOrEqual(last);
      expect(c).toBeLessThanOrEqual(1);
      last = c;
    }
    expect(SKY_FLOOR + GLOW_RISE).toBeLessThan(1);
  });

  it("fades the band from whole at its inner edge to nothing at GLOW_BAND", () => {
    expect(glowFade(-GLOW_EDGE / 2)).toBe(1);
    expect(glowFade(-GLOW_BAND)).toBe(0);
    expect(glowFade(-GLOW_BAND / 2)).toBeGreaterThan(0);
    expect(glowFade(-GLOW_BAND / 2)).toBeLessThan(1);
  });

  it("is written into the shader with the same constants, from red and green only", () => {
    expect(plateFragmentShader).toContain(`const float SKY_FLOOR = ${glslFloat(SKY_FLOOR)};`);
    expect(plateFragmentShader).toContain(`const float GLOW_RISE = ${glslFloat(GLOW_RISE)};`);
    expect(plateFragmentShader).toContain(`const float GLOW_EDGE = ${glslFloat(GLOW_EDGE)};`);
    expect(plateFragmentShader).toContain("smoothstep(SKY_FLOOR, SKY_FLOOR + GLOW_RISE, max(color.r, color.g))");
    expect(plateFragmentShader).toContain("smoothstep(-GLOW_BAND, -GLOW_EDGE, dist)");
    // The old brightness-as-coverage, blue included, is gone.
    expect(plateFragmentShader).not.toContain("max(color.g, color.b)");
  });
});

describe("cyclone", () => {
  const reach = LANDMARKS.cyclone.radius;

  it("turns forward and then back: the angle swings both ways and is zero at the start", () => {
    expect(cycloneAngle(0)).toBe(0);
    let most = 0;
    let least = 0;
    for (let t = 0; t < 240; t += 0.25) {
      most = Math.max(most, cycloneAngle(t));
      least = Math.min(least, cycloneAngle(t));
    }
    // About 12 degrees each way, as on the reference.
    expect(most).toBeGreaterThan(0.18);
    expect(least).toBeLessThan(-0.18);
    expect(Math.max(most, -least)).toBeLessThanOrEqual(CYCLONE_TURN + CYCLONE_SWAY);
  });

  it("swings slowly: a main swing of about 39 s and a quicker sway of about 27 s", () => {
    expect((2 * Math.PI) / CYCLONE_TURN_RATE).toBeCloseTo(39.3, 1);
    expect((2 * Math.PI) / CYCLONE_SWAY_RATE).toBeCloseTo(27.3, 1);
  });

  it("turns rigidly in the core and fades out at the edge of the painted arms", () => {
    expect(cycloneBody(0)).toBe(1);
    expect(cycloneBody(CYCLONE_CORE * reach)).toBe(1);
    expect(cycloneBody(reach)).toBe(0);
    expect(cycloneBody(reach * 1.5)).toBe(0);
    let last = 1;
    for (let d = 0; d <= reach; d += reach / 100) {
      expect(cycloneBody(d)).toBeLessThanOrEqual(last);
      last = cycloneBody(d);
    }
  });

  it("is written into the shader as one turn, with no crossfaded layers, inflow or breath", () => {
    expect(plateFragmentShader).toContain(`const float CYCLONE_TURN = ${glslFloat(CYCLONE_TURN)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_TURN_RATE = ${glslFloat(CYCLONE_TURN_RATE)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_SWAY = ${glslFloat(CYCLONE_SWAY)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_SWAY_RATE = ${glslFloat(CYCLONE_SWAY_RATE)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_CORE = ${glslFloat(CYCLONE_CORE)};`);
    expect(plateFragmentShader).toContain("vec2 cyclone(vec2 q)");
    expect(plateFragmentShader).toContain("limbSafe(sharedMotion(q) + cyclone(q), dist)");
    for (const gone of ["swirl(", "breathe(", "CYCLONE_INFLOW", "CYCLONE_CYCLE"]) expect(plateFragmentShader).not.toContain(gone);
  });

  it("spans the painted arms, about 190 px from the eye", () => {
    expect(reach / PX).toBeCloseTo(190, 0);
  });
});

describe("emblem mask", () => {
  it("is sampled from its own texture and keeps the cyclone's turn off the emblem", () => {
    expect(plateFragmentShader).toMatch(/uniform sampler2D uEmblem;/);
    expect(plateFragmentShader).toMatch(/vec2 cyclone\(vec2 q\)[\s\S]*\* body \* \(1\.0 - emblemAt\(q\)\);/);
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
