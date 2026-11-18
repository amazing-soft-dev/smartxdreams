import { describe, expect, it } from "vitest";
import { GLOW_EDGE, GLOW_RISE, glowCoverage, glowFade, HORIZON, horizonDistance, LANDMARKS, PLATE_ASPECT, SKY_FLOOR } from "./plate";
import {
  CALM_LIMB,
  CYCLONE_BREATH,
  CYCLONE_BREATH_PERIOD,
  CYCLONE_CORE,
  CYCLONE_CYCLE,
  CYCLONE_INFLOW,
  CYCLONE_SPIN,
  cycloneBreath,
  FULL_MOTION,
  GLOW_BAND,
  glslFloat,
  horizonChunk,
  plateFragmentShader,
  swirlLayerGap,
  swirlLayers,
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
    for (const name of ["uPlate", "uPlateRect", "uResolution", "uReady", "uSky", "uTime", "uFlow", "uEmblem"]) {
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
    // Half a cycle either side of a layer's middle, inside the core.
    expect(CYCLONE_SPIN * (CYCLONE_CYCLE / 2)).toBeLessThan(0.35);
  });

  it("keeps the two layers within 9 px of each other anywhere in the storm, so the crossfade shows no ghost", () => {
    const reach = LANDMARKS.cyclone.radius;
    let widest = 0;
    for (let d = 0; d <= reach; d += reach / 200) widest = Math.max(widest, swirlLayerGap(d));
    expect(widest / PX).toBeLessThan(9);
    // A rigid turn of the whole reach, as before, would have put them more than 20 px apart.
    expect((CYCLONE_SPIN * (CYCLONE_CYCLE / 2) * reach * 0.55) / PX).toBeGreaterThan(20);
  });

  it("turns like a real vortex: rigid in the core, then the same speed along every ring", () => {
    const speed = (d: number) => CYCLONE_SPIN * Math.min(1, CYCLONE_CORE / d) * d;
    expect(speed(CYCLONE_CORE / 2)).toBeCloseTo(speed(CYCLONE_CORE) / 2, 9);
    expect(speed(CYCLONE_CORE * 3)).toBeCloseTo(speed(CYCLONE_CORE), 9);
    expect(CYCLONE_CORE).toBeLessThan(LANDMARKS.cyclone.radius / 3);
    // The inflow is a few px per second on the master.
    expect(CYCLONE_INFLOW / PX).toBeGreaterThan(2);
    expect(CYCLONE_INFLOW / PX).toBeLessThan(6);
  });

  it("writes the swirl into the shader and no longer rocks the storm", () => {
    expect(plateFragmentShader).toContain(`const float CYCLONE_SPIN = ${glslFloat(CYCLONE_SPIN)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_CORE = ${glslFloat(CYCLONE_CORE)};`);
    expect(plateFragmentShader).toContain("min(1.0, CYCLONE_CORE / d)");
    expect(plateFragmentShader).toContain("vec2 swirl(vec2 q, float phase)");
    expect(plateFragmentShader).not.toContain("sin(uTime * 0.16)");
  });

  it("spans the painted arms, about 190 px from the eye", () => {
    expect(LANDMARKS.cyclone.radius / PX).toBeCloseTo(190, 0);
  });
});

describe("cyclone breath", () => {
  it("moves the clouds in toward the eye and back out, a few pixels each way", () => {
    expect(cycloneBreath(CYCLONE_BREATH_PERIOD / 4)).toBeCloseTo(CYCLONE_BREATH, 9); // in
    expect(cycloneBreath((CYCLONE_BREATH_PERIOD * 3) / 4)).toBeCloseTo(-CYCLONE_BREATH, 9); // out
    expect(CYCLONE_BREATH / PX).toBeGreaterThan(6);
    expect(CYCLONE_BREATH / PX).toBeLessThan(16);
  });

  it("stays bounded: after any number of breaths the storm is back where it started", () => {
    for (const n of [1, 7, 100]) expect(cycloneBreath(n * CYCLONE_BREATH_PERIOD)).toBeCloseTo(0, 9);
    for (let t = 0; t < 600; t += 0.73) expect(Math.abs(cycloneBreath(t))).toBeLessThanOrEqual(CYCLONE_BREATH + 1e-12);
  });

  it("breathes slowly, over several swirl cycles", () => {
    expect(CYCLONE_BREATH_PERIOD).toBeGreaterThan(CYCLONE_CYCLE * 2);
  });

  it("is written into the shader, kept off the eye and the emblem", () => {
    expect(plateFragmentShader).toContain(`const float CYCLONE_BREATH = ${glslFloat(CYCLONE_BREATH)};`);
    expect(plateFragmentShader).toContain(`const float CYCLONE_BREATH_PERIOD = ${glslFloat(CYCLONE_BREATH_PERIOD)};`);
    expect(plateFragmentShader).toMatch(/vec2 breathe\(vec2 q\)[\s\S]*smoothstep\(0\.0, 0\.2, d \/ CYCLONE_REACH\)[\s\S]*emblemAt\(q\)/);
  });
});

describe("emblem mask", () => {
  it("is sampled from its own texture and keeps the swirl off the emblem", () => {
    expect(plateFragmentShader).toMatch(/uniform sampler2D uEmblem;/);
    expect(plateFragmentShader).toMatch(/vec2 swirl\(vec2 q, float phase\)[\s\S]*\* \(1\.0 - emblemAt\(q\)\);/);
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
