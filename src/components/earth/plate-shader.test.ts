import { describe, expect, it } from "vitest";
import {
  EMBLEM_REGION_RANGE,
  EMBLEM_STROKES,
  GLOW_EDGE,
  GLOW_RISE,
  glowCoverage,
  glowFade,
  HORIZON,
  horizonDistance,
  LANDMARKS,
  PLATE_ASPECT,
  SKY_FLOOR,
} from "./plate";
import {
  ambientAt,
  CALM_LIMB,
  CYCLONE_CORE,
  CYCLONE_SWAY,
  CYCLONE_SWAY_RATE,
  CYCLONE_TURN,
  CYCLONE_TURN_RATE,
  cycloneAngle,
  cycloneAt,
  cycloneBody,
  EMBLEM_DRIFT,
  EMBLEM_DRIFT_RATES,
  EMBLEM_FADE,
  emblemDrift,
  emblemWholeAt,
  FULL_MOTION,
  GLOW_BAND,
  glslFloat,
  horizonChunk,
  MASTER_PX,
  motionPx,
  plateFragmentShader,
  WAKE_BLUR,
  WAKE_GAIN,
  WEATHER_BANDS,
  WEATHER_RATES,
  WEATHER_SYSTEMS,
  WEATHER_WAVE,
  weatherAt,
  weatherField,
} from "./plate-shader";

/** Plate heights per master pixel. */
const PX = 1 / 948;

type Motion = (x: number, y: number, t: number) => { x: number; y: number };

/**
 * The change in area, as a fraction, that `motion` (where the content at a point comes from, relative to it)
 * gives a small patch of the plate at (x, y) at time t. It is |det J - 1| of the map q -> q + motion(q): 0 for a
 * pure turn or slide, and what reads as a zoom when it pulses.
 */
function areaChange(motion: Motion, x: number, y: number, t: number): number {
  const h = 1e-4;
  const px = motion(x + h, y, t);
  const mx = motion(x - h, y, t);
  const py = motion(x, y + h, t);
  const my = motion(x, y - h, t);
  const a = 1 + (px.x - mx.x) / (2 * h);
  const b = (py.x - my.x) / (2 * h);
  const c = (px.y - mx.y) / (2 * h);
  const d = 1 + (py.y - my.y) / (2 * h);
  return Math.abs(a * d - b * c - 1);
}

/** The largest areaChange() within `radius` of `centre` (a square around it), over the first 80 s. */
function worstAreaChange(motion: Motion, centre: { x: number; y: number }, radius: number, seconds = 80): number {
  let worst = 0;
  for (let t = 0; t < seconds; t += 2.7) {
    for (let x = centre.x - radius; x <= centre.x + radius; x += radius / 12) {
      for (let y = centre.y - radius; y <= centre.y + radius; y += radius / 12) worst = Math.max(worst, areaChange(motion, x, y, t));
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

  it("turns the cyclone around the painted eye", () => {
    const { cyclone } = LANDMARKS;
    expect(plateFragmentShader).toContain(
      `const vec2 CYCLONE = vec2(${glslFloat(cyclone.u * PLATE_ASPECT)}, ${glslFloat(cyclone.v)});`,
    );
    expect(plateFragmentShader).toContain(`const float CYCLONE_REACH = ${glslFloat(cyclone.radius)};`);
  });

  it("is plain ASCII, which GLSL ES requires even in comments (one ² failed to compile)", () => {
    expect(plateFragmentShader).toMatch(/^[\x00-\x7f]*$/);
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

describe("weather systems", () => {
  /** Points on the planet with full motion (deeper than FULL_MOTION), every `step` plate heights. */
  function* planet(step: number) {
    for (let x = 0.02; x < PLATE_ASPECT; x += step) {
      for (let y = 0.02; y < 1; y += step) if (horizonDistance(x / PLATE_ASPECT, y) >= FULL_MOTION) yield [x, y] as const;
    }
  }

  it("start from zero, so the scene's first frame is the still plate, and stay bounded", () => {
    for (const [x, y] of planet(0.05)) {
      expect(weatherAt(x, y, 0)).toEqual({ x: 0, y: 0 });
      for (const t of [7, 61, 333, 4000]) {
        const w = weatherAt(x, y, t);
        expect(Math.abs(w.x) / PX).toBeLessThanOrEqual(2 * WEATHER_BANDS[0] + 1e-9);
        expect(Math.abs(w.y) / PX).toBeLessThanOrEqual(2 * WEATHER_BANDS[1] + 1e-9);
      }
    }
  });

  it("sit over the open ocean, deep inside the limb", () => {
    for (const s of WEATHER_SYSTEMS) {
      expect(horizonDistance(s.x / PLATE_ASPECT, s.y), s.name).toBeGreaterThan(FULL_MOTION * 2);
      expect(weatherField(s.x, s.y)).toBe(1);
    }
  });

  it("leave the land almost still: the continents' interiors move a few percent of the clouds' slide", () => {
    // On the master, in pixels: the Great Plains, Florida, and the Amazon.
    for (const [px, py] of [[713, 497], [853, 626], [1015, 864]] as const) {
      expect(weatherField(px * PX, py * PX)).toBeLessThan(0.2);
    }
  });

  it("move the clouds visibly: tens of pixels over half a minute in every system", () => {
    for (const s of WEATHER_SYSTEMS) {
      let most = 0;
      for (let t = 0; t < 30; t += 0.5) {
        const w = weatherAt(s.x, s.y, t);
        most = Math.max(most, Math.hypot(w.x, w.y) / PX);
      }
      expect(most, s.name).toBeGreaterThan(15);
    }
  });

  it("slide clouds past each other without zooming: no patch grows or shrinks by a sixth, and few by much", () => {
    // Over the whole planet, for three minutes, on the master (worst about 15%, 2% on average). The noise patches
    // they replace reached 44%.
    const motion: Motion = (x, y, t) => weatherAt(x, y, t);
    let worst = 0;
    let total = 0;
    let count = 0;
    for (let t = 0; t < 180; t += 2.3) {
      for (const [x, y] of planet(0.03)) {
        const change = areaChange(motion, x, y, t);
        worst = Math.max(worst, change);
        total += change;
        count++;
      }
    }
    expect(worst).toBeLessThan(1 / 6);
    expect(total / count).toBeLessThan(0.04);
  });

  it("move a plate drawn smaller than the master no further, for its size, than the master", () => {
    expect(MASTER_PX).toBeCloseTo(PX, 12);
    expect(motionPx(PX / 2)).toBe(PX / 2); // a plate drawn larger: screen pixels
    expect(motionPx(PX * 2)).toBe(PX); // a phone's smaller plate: master pixels
    expect(plateFragmentShader).toContain("min(pxToPlate(), MASTER_PX)");
    expect(plateFragmentShader).toContain("* motionPx();");
  });

  it("are written into the shader, with no curl-noise currents or noise patches left", () => {
    expect(plateFragmentShader).toContain(`const vec2 WEATHER_BANDS = vec2(${glslFloat(WEATHER_BANDS[0])}, ${glslFloat(WEATHER_BANDS[1])});`);
    expect(plateFragmentShader).toContain(`const vec2 WEATHER_RATES = vec2(${glslFloat(WEATHER_RATES[0])}, ${glslFloat(WEATHER_RATES[1])});`);
    expect(plateFragmentShader).toContain(`const float WEATHER_WAVE = ${glslFloat(WEATHER_WAVE)};`);
    WEATHER_SYSTEMS.forEach((s, i) => {
      expect(plateFragmentShader).toContain(
        `const vec4 WEATHER_SYSTEM_${i} = vec4(${[s.x, s.y, s.width, s.height].map(glslFloat).join(", ")}); // ${s.name}`,
      );
      expect(plateFragmentShader).toContain(`weatherSystem(q, WEATHER_SYSTEM_${i})`);
    });
    expect(plateFragmentShader).toContain("return bands(q) * weatherField(q) * motionPx();");
    for (const gone of ["noise3", "currents(", "CURRENT_", "patches"]) expect(plateFragmentShader).not.toContain(gone);
  });

  it("agree with the scene's first frame: the drift, the bands and the cyclone are all sines from zero", () => {
    expect(plateFragmentShader).toContain("vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043))");
    expect(plateFragmentShader).toContain("sin(uTime * WEATHER_RATES.x + q.y * WEATHER_WAVE) - sin(q.y * WEATHER_WAVE)");
    expect(plateFragmentShader).toContain("sin(uTime * WEATHER_RATES.y + q.x * WEATHER_WAVE) - sin(q.x * WEATHER_WAVE)");
    expect(plateFragmentShader).toContain(
      "CYCLONE_TURN * sin(uTime * CYCLONE_TURN_RATE) + CYCLONE_SWAY * sin(uTime * CYCLONE_SWAY_RATE)",
    );
  });
});

describe("emblem drift", () => {
  /** Points on the emblem's strokes: every traced point, in plate heights. */
  const strokePoints = EMBLEM_STROKES.flatMap(({ points }) => points.map(([x, y]) => [x! * PX, y! * PX] as const));

  it("starts still and drifts by tens of pixels within half a minute", () => {
    expect(emblemDrift(0)).toEqual({ x: 0, y: 0 });
    let widest = 0;
    for (let t = 0; t < 30; t += 0.25) widest = Math.max(widest, Math.abs(emblemDrift(t).x) / PX);
    expect(widest).toBeGreaterThan(14);
    expect(widest).toBeLessThanOrEqual(EMBLEM_DRIFT[0]);
  });

  it("drifts slowly, on 31 s and 42 s sines", () => {
    expect((2 * Math.PI) / EMBLEM_DRIFT_RATES[0]).toBeCloseTo(31.4, 1);
    expect((2 * Math.PI) / EMBLEM_DRIFT_RATES[1]).toBeCloseTo(41.9, 1);
  });

  it("moves every stroke by the same amount at once, so the emblem keeps its shape", () => {
    for (const t of [4, 11.3, 29, 77]) {
      const drift = emblemDrift(t);
      for (const [x, y] of strokePoints) {
        expect(emblemWholeAt(x, y)).toBe(1);
        const m = ambientAt(x, y, t);
        expect(m.x).toBeCloseTo(drift.x, 12);
        expect(m.y).toBeCloseTo(drift.y, 12);
      }
    }
  });

  it("carries the ocean beside it and lets the land go: the plains stay still, the nearest coast mostly so", () => {
    // On the master, in pixels: the Great Plains, and the coasts of the Carolinas and of Florida.
    expect(emblemWholeAt(713 * PX, 497 * PX)).toBe(0);
    expect(emblemWholeAt(900 * PX, 455 * PX)).toBeLessThan(0.3);
    expect(emblemWholeAt(853 * PX, 626 * PX)).toBeLessThan(0.4);
    // The open ocean between the emblem's strokes moves with it.
    expect(emblemWholeAt(1300 * PX, 470 * PX)).toBeGreaterThan(0.95);
  });

  it("blends into the weather without zooming: no patch grows or shrinks by much more than a fifth", () => {
    // Over the whole planet, for three minutes, on the master: the weather, giving way to the drift near the emblem.
    const motion: Motion = (x, y, t) => ambientAt(x, y, t);
    let worst = 0;
    let total = 0;
    let count = 0;
    for (let t = 0; t < 180; t += 3.1) {
      for (let x = 0.02; x < PLATE_ASPECT; x += 0.03) {
        for (let y = 0.02; y < 1; y += 0.03) {
          if (horizonDistance(x / PLATE_ASPECT, y) < FULL_MOTION) continue;
          const change = areaChange(motion, x, y, t);
          worst = Math.max(worst, change);
          total += change;
          count++;
        }
      }
    }
    expect(worst).toBeLessThan(0.23);
    expect(total / count).toBeLessThan(0.05);
  });

  it("is written into the shader, reading the distance from the mask's green channel", () => {
    expect(plateFragmentShader).toContain(`const vec2 EMBLEM_DRIFT = vec2(${glslFloat(EMBLEM_DRIFT[0])}, ${glslFloat(EMBLEM_DRIFT[1])});`);
    expect(plateFragmentShader).toContain(
      `const vec2 EMBLEM_DRIFT_RATES = vec2(${glslFloat(EMBLEM_DRIFT_RATES[0])}, ${glslFloat(EMBLEM_DRIFT_RATES[1])});`,
    );
    expect(plateFragmentShader).toContain(`const float EMBLEM_FADE = ${glslFloat(EMBLEM_FADE)};`);
    expect(plateFragmentShader).toContain(`const float EMBLEM_REGION_RANGE = ${glslFloat(EMBLEM_REGION_RANGE)};`);
    expect(plateFragmentShader).toContain(".g * EMBLEM_REGION_RANGE;");
    expect(plateFragmentShader).toContain("mix(weather(q), emblemDrift(), emblemWhole(q))");
    expect(plateFragmentShader).toContain("* motionPx();\n}");
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

describe("cyclone and emblem", () => {
  it("turns everything in the storm's reach, the emblem's upper stroke included, as on the reference", () => {
    expect(plateFragmentShader).toMatch(/vec2 cyclone\(vec2 q\)[\s\S]*CYCLONE_SWAY_RATE\)\) \* body;/);
    expect(plateFragmentShader).not.toContain("emblemAt");
    // The upper stroke lies inside the reach, so it turns: its centre line's nearest point to the eye moves.
    const eye = { x: LANDMARKS.cyclone.u * PLATE_ASPECT, y: LANDMARKS.cyclone.v };
    const stroke = EMBLEM_STROKES.flatMap(({ points }) => points.map(([x, y]) => ({ x: x! * PX, y: y! * PX })));
    const nearest = stroke.reduce((a, b) => (Math.hypot(b.x - eye.x, b.y - eye.y) < Math.hypot(a.x - eye.x, a.y - eye.y) ? b : a));
    expect(Math.hypot(nearest.x - eye.x, nearest.y - eye.y)).toBeLessThan(LANDMARKS.cyclone.radius);
    const m = cycloneAt(nearest.x, nearest.y, Math.PI / 2 / CYCLONE_TURN_RATE);
    expect(Math.hypot(m.x, m.y) / PX).toBeGreaterThan(3);
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

  it("is read at each pixel, on the emblem as anywhere else: the cursor never carries the emblem as one block", () => {
    // As on the reference: one local read of the wake, with no average across the emblem and no exceptions.
    expect(plateFragmentShader).toContain("- wakeAt(vUv);");
    expect(plateFragmentShader.match(/wakeAt\(/g)).toHaveLength(2); // its definition and that one read
    for (const gone of ["SYMBOL", "canvasAt", "vec2 wake(", "symbolCalm"]) expect(plateFragmentShader).not.toContain(gone);
  });
});
