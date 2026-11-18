/**
 * Shaders for the painted Earth plate behind the Home hero.
 *
 * One full-screen pass: every pixel is mapped into the plate (`uPlateRect`, from plate-layout.ts) and coloured
 * from the plate texture on the planet, inside the limb. Outside it only the painted atmosphere glow is kept,
 * fading out over a narrow band; the plate's black sky and painted stars are replaced by the hero's own sky.
 *
 * Motion moves where the plate is sampled, never the limb: it is off in a calm band just inside the limb,
 * eases in, and its travel is capped at half the distance to that band, so sky and glow are never pulled in.
 *
 * Coordinates: `p` is in hero heights from the bottom-left (x up to width/height). Plate coordinates `uv` run
 * 0..1 left to right and top to bottom, as in plate.ts. The texture is sampled as is (no colour-space
 * conversion), and the output is premultiplied alpha.
 */

import { FLUID_HEIGHT, FLUID_WIDTH, MAX_DISPLACEMENT } from "./fluid";
import { GLOW_BAND, GLOW_EDGE, GLOW_RISE, HORIZON, LANDMARKS, PLATE_ASPECT, SKY_FLOOR } from "./plate";

/** A GLSL float literal: always with a decimal point, and with a sign when negative. */
export function glslFloat(value: number): string {
  const text = value.toFixed(6);
  return text.includes(".") ? text : `${text}.0`;
}

/** Full-screen quad: a 2 x 2 plane drawn straight to clip space, so the camera does not matter. */
export const plateVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const [h0, h1, h2, h3] = HORIZON.map(glslFloat);

/** The limb, from plate.ts: the same cubic and the same signed distance (plate heights, positive on the planet). */
export const horizonChunk = /* glsl */ `
const float PLATE_ASPECT = ${glslFloat(PLATE_ASPECT)};

float horizonV(float u) {
  return ((${h3} * u + ${h2}) * u + ${h1}) * u + ${h0};
}

float horizonDistance(vec2 uv) {
  float slope = ((3.0 * ${h3} * uv.x + 2.0 * ${h2}) * uv.x + ${h1}) / PLATE_ASPECT;
  return (uv.y - horizonV(uv.x)) / sqrt(1.0 + slope * slope);
}
`;

/** Value noise in 3D, for static patches of weather. */
export const noiseChunk = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
`;

/** Motion is off within this many plate heights inside the limb, and at full strength from FULL_MOTION in. */
export const CALM_LIMB = 0.018;
export const FULL_MOTION = 0.065;

/**
 * How strongly the fluid wake moves the plate: one cell of displacement moves it by this fraction of a cell's
 * width on screen (about 3.4 px on a 1440 px canvas), so a drag pushes the clouds up to about 9 px.
 */
export const WAKE_GAIN = 0.3;

/** The wake is read as the average of five taps this many cells apart, so it bends the picture smoothly. */
export const WAKE_BLUR = 1.5;

/**
 * The cyclone turns counter-clockwise (as seen, like a northern-hemisphere storm) and its clouds drift in
 * toward the eye. Turning the picture continuously would wind the spiral tighter forever, so, as flow-map
 * water shaders do, two layers turn it, half a cycle apart: each turns a small, bounded amount before it
 * starts again, and they are crossfaded so neither restart shows.
 * - CYCLONE_CYCLE: seconds per layer cycle
 * - CYCLONE_SPIN: turn at the eye, radians per second
 * - CYCLONE_INFLOW: inward drift, as a fraction of the distance to the eye per second
 */
export const CYCLONE_CYCLE = 4;
export const CYCLONE_SPIN = 0.16;
export const CYCLONE_INFLOW = 0.03;

/**
 * The two swirl layers at time `t` (seconds): each one's phase (0..1 through its cycle) and its weight in the
 * crossfade. A layer is weighted most halfway through its cycle, where it has turned least, and not at all as
 * it restarts; the weights always add up to 1. Mirrors the shader.
 */
export function swirlLayers(t: number): [{ phase: number; weight: number }, { phase: number; weight: number }] {
  const fract = (x: number) => x - Math.floor(x);
  const phases = [fract(t / CYCLONE_CYCLE), fract(t / CYCLONE_CYCLE + 0.5)] as const;
  return [
    { phase: phases[0], weight: 1 - Math.abs(2 * phases[0] - 1) },
    { phase: phases[1], weight: 1 - Math.abs(2 * phases[1] - 1) },
  ];
}

/**
 * On top of its turn, the cyclone breathes: its clouds ease in toward the eye and back out again, the whole
 * spiral at once, as in footage of a storm seen from orbit.
 * - CYCLONE_BREATH: how far the clouds move in and out at full strength, plate heights (about 11 px on the
 *   master, 9 px on a 1475 px desktop hero)
 * - CYCLONE_BREATH_PERIOD: seconds for one breath in and out
 * The eye itself stays put (the breath grows from nothing over the inner fifth of the reach), so the centre
 * never pinches.
 */
export const CYCLONE_BREATH = 0.012;
export const CYCLONE_BREATH_PERIOD = 9;

/** The breath at time `t` (seconds), in plate heights: positive while the clouds move in. Mirrors the shader. */
export function cycloneBreath(t: number): number {
  return CYCLONE_BREATH * Math.sin((2 * Math.PI * t) / CYCLONE_BREATH_PERIOD);
}

export { GLOW_BAND };

export const plateFragmentShader = /* glsl */ `
uniform sampler2D uPlate;
uniform vec4 uPlateRect;    // the plate's left, bottom, width and height, in hero heights
uniform vec2 uResolution;   // canvas size in CSS px
uniform float uReady;       // 1 once the plate texture has loaded
uniform vec4 uSky;          // what shows outside the planet and its glow (premultiplied; alpha 0 lets the page show)
uniform float uTime;        // seconds the scene has been running
uniform sampler2D uFlow;    // the fluid wake's displacement over the canvas (fluid.ts): red x, green y, 0.5 = still
uniform sampler2D uEmblem;  // the cloud emblem's mask over the plate (earth-emblem-mask.png): 1 on the emblem

varying vec2 vUv;

${horizonChunk}
${noiseChunk}

const float GLOW_BAND = ${glslFloat(GLOW_BAND)};
const float GLOW_EDGE = ${glslFloat(GLOW_EDGE)};
const float SKY_FLOOR = ${glslFloat(SKY_FLOOR)};
const float GLOW_RISE = ${glslFloat(GLOW_RISE)};
const float CALM_LIMB = ${glslFloat(CALM_LIMB)};
const float FULL_MOTION = ${glslFloat(FULL_MOTION)};
const vec2 FLUID_CELLS = vec2(${glslFloat(FLUID_WIDTH)}, ${glslFloat(FLUID_HEIGHT)});
const float MAX_DISPLACEMENT = ${glslFloat(MAX_DISPLACEMENT)};
const float WAKE_GAIN = ${glslFloat(WAKE_GAIN)};
const float WAKE_BLUR = ${glslFloat(WAKE_BLUR)};

// The painted cyclone's eye and reach, in plate heights (plate.ts).
const vec2 CYCLONE = vec2(${glslFloat(LANDMARKS.cyclone.u * PLATE_ASPECT)}, ${glslFloat(LANDMARKS.cyclone.v)});
const float CYCLONE_REACH = ${glslFloat(LANDMARKS.cyclone.radius)};
const float CYCLONE_CYCLE = ${glslFloat(CYCLONE_CYCLE)};
const float CYCLONE_SPIN = ${glslFloat(CYCLONE_SPIN)};
const float CYCLONE_INFLOW = ${glslFloat(CYCLONE_INFLOW)};
const float CYCLONE_BREATH = ${glslFloat(CYCLONE_BREATH)};
const float CYCLONE_BREATH_PERIOD = ${glslFloat(CYCLONE_BREATH_PERIOD)};
const float TAU = 6.2831853;

// The cloud symbol's centre and half-size, in plate heights (plate.ts).
const vec2 SYMBOL = vec2(${glslFloat(LANDMARKS.symbol.u * PLATE_ASPECT)}, ${glslFloat(LANDMARKS.symbol.v)});
const vec2 SYMBOL_HALF = vec2(${glslFloat((LANDMARKS.symbol.width * PLATE_ASPECT) / 2)}, ${glslFloat(LANDMARKS.symbol.height / 2)});

// Motion works in plate heights, x right and y down: q = (u * PLATE_ASPECT, v).

// Converts screen pixels to plate heights at the current size.
float pxToPlate() {
  return 1.0 / (uResolution.y * uPlateRect.w);
}

// The slow movement of the globe and its weather, in plate heights; zero at t = 0. As on the reference:
// a shared orbital drift, small at every size, and weather bands sliding across the oceans, strongest in a
// few static patches of weather. Broad and coherent, never tied to pixel brightness, which would tear the
// painted coasts and clouds.
vec2 orbital() {
  return vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043)) * pxToPlate();
}

// The bands vary across the picture, so over the cloud symbol they would slowly bend the S and the D out of
// shape. They fade out over a soft ellipse around it, and the symbol rides the orbital drift as one piece.
float symbolCalm(vec2 q) {
  return 1.0 - smoothstep(0.85, 1.35, length((q - SYMBOL) / SYMBOL_HALF));
}

vec2 weather(vec2 q) {
  vec2 bands = vec2(28.0 * (sin(uTime * 0.22 + q.y * 3.0) - sin(q.y * 3.0)),
                    12.0 * (sin(uTime * 0.18 + q.x * 3.0) - sin(q.x * 3.0)));
  float patches = smoothstep(0.35, 0.7, noise3(vec3(q * 2.4, 4.0)));
  return bands * patches * (1.0 - symbolCalm(q)) * pxToPlate();
}

// How much of the plate at q (plate heights) is the cloud emblem, 0..1, from its soft mask. Until the mask
// has loaded the scene holds a 1 x 1 white texture, so everything counts as emblem and nothing turns.
float emblemAt(vec2 q) {
  return texture2D(uEmblem, vec2(q.x / PLATE_ASPECT, 1.0 - q.y)).r;
}

// One swirl layer of the cyclone at the given phase (0..1 through its cycle). The content at q has turned
// counter-clockwise (as seen) and drifted in toward the eye, by an amount that grows through the cycle from
// zero at its middle, most at the eye and not at all past its reach; so it came from a point turned back and
// pushed out. Returns that point relative to q. (In plate coordinates y points down, so a positive angle here
// turns clockwise as seen.)
vec2 swirl(vec2 q, float phase) {
  vec2 r = q - CYCLONE;
  float heart = 1.0 - smoothstep(0.4, 1.15, length(r) / CYCLONE_REACH);
  float s = (phase - 0.5) * CYCLONE_CYCLE;
  float a = CYCLONE_SPIN * s * heart;
  float grow = 1.0 + CYCLONE_INFLOW * s * heart;
  float c = cos(a), sn = sin(a);
  // The emblem's upper stroke passes within about 100 px of the eye, inside the storm's painted reach: the
  // swirl leaves it alone, so it keeps its shape while the arms beside it turn.
  return (vec2(c * r.x - sn * r.y, sn * r.x + c * r.y) * grow - r) * (1.0 - emblemAt(q));
}

// The cyclone's breath at q: where the content comes from, relative to q. While the breath is positive the
// content at q came from further out, so the clouds move in toward the eye; then they ease back out. The
// whole spiral breathes together, fully over the inner part of the reach and not at all past it; the eye is
// left still (the breath grows from nothing over the inner fifth of the reach), and so is the emblem.
vec2 breathe(vec2 q) {
  vec2 r = q - CYCLONE;
  float d = length(r);
  if (d < 1e-5) return vec2(0.0);
  float body = (1.0 - smoothstep(0.55, 1.0, d / CYCLONE_REACH)) * smoothstep(0.0, 0.2, d / CYCLONE_REACH);
  float b = CYCLONE_BREATH * sin(TAU * uTime / CYCLONE_BREATH_PERIOD);
  return r / d * (b * body * (1.0 - emblemAt(q)));
}

// The fluid's displacement at a point of the canvas (0..1, y up), in cells.
vec2 flowAt(vec2 at) {
  return (texture2D(uFlow, at).rg * 255.0 - 128.0) / 127.0 * MAX_DISPLACEMENT;
}

// The pointer wake at a point of the canvas, in plate heights (x right, y down): the fluid's displacement,
// softened over five taps so it bends the picture smoothly rather than stretching it into streaks, turned
// into a fraction of the canvas and then into plate heights.
vec2 wakeAt(vec2 at) {
  vec2 step = WAKE_BLUR / FLUID_CELLS;
  vec2 cells = (flowAt(at) * 2.0 + flowAt(at + vec2(step.x, 0.0)) + flowAt(at - vec2(step.x, 0.0))
    + flowAt(at + vec2(0.0, step.y)) + flowAt(at - vec2(0.0, step.y))) / 6.0;
  vec2 canvas = cells / FLUID_CELLS * WAKE_GAIN;
  vec2 hero = vec2(canvas.x * uResolution.x / uResolution.y, -canvas.y);
  return hero / uPlateRect.w;
}

// Where plate point q (plate heights) is on the canvas (0..1, y up).
vec2 canvasAt(vec2 q) {
  vec2 hero = vec2(uPlateRect.x + q.x / PLATE_ASPECT * uPlateRect.z, uPlateRect.y + (1.0 - q.y) * uPlateRect.w);
  return vec2(hero.x / (uResolution.x / uResolution.y), hero.y);
}

// The wake at this pixel. Over the cloud symbol it is the wake averaged across the symbol, so the symbol is
// carried as one piece and keeps its shape, while the clouds around it flow; the two blend over the same soft
// ellipse that calms the weather bands.
vec2 wake(vec2 q) {
  vec2 local = wakeAt(vUv);
  float calm = symbolCalm(q);
  if (calm < 0.001) return local;
  vec2 whole = (wakeAt(canvasAt(SYMBOL)) * 2.0
    + wakeAt(canvasAt(SYMBOL + vec2(SYMBOL_HALF.x * 0.6, 0.0))) + wakeAt(canvasAt(SYMBOL - vec2(SYMBOL_HALF.x * 0.6, 0.0)))
    + wakeAt(canvasAt(SYMBOL + vec2(0.0, SYMBOL_HALF.y * 0.6))) + wakeAt(canvasAt(SYMBOL - vec2(0.0, SYMBOL_HALF.y * 0.6)))) / 6.0;
  return mix(local, whole, calm);
}

// Where the content at q comes from, relative to q, eased in from the calm band and capped so it never
// reaches across it. Sampling against the wake moves the content along it. 'extra' is the cyclone's swirl.
vec2 motion(vec2 q, float dist, vec2 extra) {
  if (dist <= CALM_LIMB) return vec2(0.0);
  vec2 delta = (orbital() + weather(q) + extra - wake(q)) * smoothstep(CALM_LIMB, FULL_MOTION, dist);
  float limit = (dist - CALM_LIMB) * 0.5;
  float travel = length(delta);
  return travel > limit ? delta * (limit / travel) : delta;
}

vec3 plateColor(vec2 uv) {
  // Textures are stored bottom row first.
  return texture2D(uPlate, vec2(uv.x, 1.0 - uv.y)).rgb;
}

// The plate's colour at q (plate heights) moved by everything, the cyclone's swirl as two crossfaded layers.
// Only pixels within the cyclone's reach pay for the second sample.
vec3 movedColor(vec2 q, float dist) {
  if (length(q - CYCLONE) > CYCLONE_REACH * 1.15) {
    vec2 moved = q + motion(q, dist, vec2(0.0));
    return plateColor(vec2(moved.x / PLATE_ASPECT, moved.y));
  }
  float t = uTime / CYCLONE_CYCLE;
  float p1 = fract(t);
  float p2 = fract(t + 0.5);
  float w1 = 1.0 - abs(2.0 * p1 - 1.0);
  vec2 breath = breathe(q);
  vec2 m1 = q + motion(q, dist, swirl(q, p1) + breath);
  vec2 m2 = q + motion(q, dist, swirl(q, p2) + breath);
  return mix(plateColor(vec2(m2.x / PLATE_ASPECT, m2.y)), plateColor(vec2(m1.x / PLATE_ASPECT, m1.y)), w1);
}

void main() {
  vec2 p = vUv * vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = vec2((p.x - uPlateRect.x) / uPlateRect.z, 1.0 - (p.y - uPlateRect.y) / uPlateRect.w);
  if (uReady < 0.5 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = uSky;
    return;
  }
  float dist = horizonDistance(uv);
  if (dist < -GLOW_BAND) {
    gl_FragColor = uSky;
    return;
  }
  vec2 q = vec2(uv.x * PLATE_ASPECT, uv.y);
  vec3 color = movedColor(q, dist);
  float alpha = 1.0;
  if (dist < 0.0) {
    // In the sky: only the atmosphere glow, not the painted sky (plate.ts glowCoverage()). The sky is navy, dark
    // in red and green and blue only in its haze, while the rim, the sunrise and the high streaks are bright in
    // red or green, so the brighter of those above the sky's own floor is the glow's coverage. Brightness with
    // blue counted would lay the navy haze over our sky as a veil. It also fades out across the band
    // (glowFade()), which drops the painted stars beyond it.
    float glow = smoothstep(SKY_FLOOR, SKY_FLOOR + GLOW_RISE, max(color.r, color.g));
    alpha = glow * smoothstep(-GLOW_BAND, -GLOW_EDGE, dist);
  }
  // Premultiplied: the plate over the sky.
  gl_FragColor = vec4(color * alpha, alpha) + uSky * (1.0 - alpha);
}
`;
