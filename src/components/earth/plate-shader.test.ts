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
  cycloneAt,
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

type Motion = (x: number, y: number, t: number) => { x: number; y: number };

/**
 * The largest change in area, as a fraction, that `motion` (where the content at a point comes from, relative to
 * it) gives any small patch of the plate within `radius` of `centre`, over the first 80 s. It is |det J - 1| of
 * the map q -> q + motion(q): 0 for a pure turn or slide, and what reads as a zoom when it pulses.
 */
function worstAreaChange(motion: Motion, centre: { x: number; y: number }, radius: number, seconds = 80): number {
  const h = 1e-4;
  let worst = 0;
  for (let t = 0; t < seconds; t += 2.7) {
    for (let x = centre.x - radius; x <= centre.x + radius; x += radius / 12) {
      for (let y = centre.y - radius; y <= centre.y + radius; y += radius / 12) {
        const px = motion(x + h, y, t);
        const mx = motion(x - h, y, t);
        const py = motion(x, y + h, t);
        const my = motion(x, y - h, t);
        const a = 1 + (px.x - mx.x) / (2 * h);
        const b = (py.x - my.x) / (2 * h);
        const c = (px.y - mx.y) / (2 * h);
        const d = 1 + (py.y - my.y) / (2 * h);
        worst = Math.max(worst, Math.abs(a * d - b * c - 1));
      }
    }
  }
  return worst;
}

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
  const eye = { x: LANDMARKS.cyclone.u * PLATE_ASPECT, y: LANDMARKS.cyclone.v };
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

  it("moves every cloud along its own ring: none moves toward or away from the eye", () => {
    for (const t of [3, 9.8, 17, 31.4, 60]) {
      for (let d = 0.01; d < reach; d += 0.02) {
        for (let a = 0; a < 2 * Math.PI; a += 0.7) {
          const x = eye.x + d * Math.cos(a);
          const y = eye.y + d * Math.sin(a);
          const m = cycloneAt(x, y, t);
          expect(Math.hypot(x + m.x - eye.x, y + m.y - eye.y)).toBeCloseTo(d, 9);
        }
      }
    }
  });

  it("neither grows nor shrinks any cloud (no zoom into the eye): the turn keeps areas", () => {
    // The Jacobian of q -> q + cycloneAt(q): its determinant is the factor a small cloud's area changes by.
    expect(worstAreaChange((x, y, t) => cycloneAt(x, y, t), eye, reach)).toBeLessThan(1e-3);
  });

  it("moves the arms visibly at the height of a swing: several pixels at the core, more further out", () => {
    const t = Math.PI / 2 / CYCLONE_TURN_RATE;
    const core = cycloneAt(eye.x + CYCLONE_CORE * reach, eye.y, t);
    expect(Math.hypot(core.x, core.y) / PX).toBeGreaterThan(6);
    const mid = cycloneAt(eye.x + reach * 0.5, eye.y, t);
    expect(Math.hypot(mid.x, mid.y) / PX).toBeGreaterThan(8);
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

describe("the scene's first frame", () => {
  it("starts every motion from zero: the drift and weather are sines from t = 0, and so is the cyclone's turn", () => {
    expect(plateFragmentShader).toContain("vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043))");
    expect(plateFragmentShader).toContain("sin(uTime * 0.22 + q.y * 3.0) - sin(q.y * 3.0)");
    expect(plateFragmentShader).toContain(
      "CYCLONE_TURN * sin(uTime * CYCLONE_TURN_RATE) + CYCLONE_SWAY * sin(uTime * CYCLONE_SWAY_RATE)",
    );
    for (const gone of ["currents(", "CURRENT_"]) expect(plateFragmentShader).not.toContain(gone);
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
