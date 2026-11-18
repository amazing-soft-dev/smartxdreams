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

import { MAX_DISPLACEMENT } from "./fluid";
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

const fract = (x: number) => x - Math.floor(x);

/** The shader's hash13(), in JavaScript. GLSL works in 32-bit floats, so the two agree in kind, not digit for digit. */
export function hash13(x: number, y: number, z: number): number {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(z * 0.1031);
  const d = px * (pz + 31.32) + py * (py + 31.32) + pz * (px + 31.32);
  px += d;
  py += d;
  pz += d;
  return fract((px + py) * pz);
}

/** The shader's noise3(), in JavaScript: smooth value noise, 0..1. */
export function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const fx = s(x - ix);
  const fy = s(y - iy);
  const fz = s(z - iz);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const h = (dx: number, dy: number, dz: number) => hash13(ix + dx, iy + dy, iz + dz);
  return mix(
    mix(mix(h(0, 0, 0), h(1, 0, 0), fx), mix(h(0, 1, 0), h(1, 1, 0), fx), fy),
    mix(mix(h(0, 0, 1), h(1, 0, 1), fx), mix(h(0, 1, 1), h(1, 1, 1), fx), fy),
    fz,
  );
}

/**
 * Ambient currents: with no pointer, the clouds still flow, along broad curling currents that drift slowly
 * across the planet, as on the reference. The plate is displaced by the curl of a smooth noise field (a stream
 * function), so the flow is divergence-free: clouds swirl and stream past one another without piling up or
 * thinning out. The field drifts across the planet and slowly changes, so the currents travel and turn; the
 * displacement is bounded, so after minutes nothing has smeared, and a single sample needs no crossfade.
 * - CURRENT_SCALE: noise cells per plate height (broad currents, a few across the planet)
 * - CURRENT_DRIFT: how fast the field travels across the planet, noise cells per second (x, y down)
 * - CURRENT_EVOLVE: how fast it changes in place, noise cells per second
 * - CURRENT_STRENGTH: displacement per unit of curl; the curl of this noise peaks near 2.7, so the currents
 *   move the plate up to about 0.013 plate heights (12-13 px on the master), about 4 px on average
 * - CURRENT_STEP: the finite-difference step for the curl, plate heights
 */
export const CURRENT_SCALE = 2.2;
export const CURRENT_DRIFT = [0.05, 0.015] as const;
export const CURRENT_EVOLVE = 0.04;
export const CURRENT_STRENGTH = 0.005;
export const CURRENT_STEP = 0.02;

/**
 * Seconds over which the currents grow from nothing when the scene starts. Every other motion is zero at its
 * first frame (the drift and weather are sines from zero, the cyclone's layers start untouched, the wake is
 * still), so the scene's first frame is the still plate the CSS fallback shows underneath, and it fades in
 * without a jump. The currents' field is not zero at any time, so they ease in instead.
 */
export const CURRENT_EASE_IN = 4;

/** How much of the currents is in force `t` seconds after the scene started (0..1). Mirrors the shader. */
export function currentEase(t: number): number {
  const x = Math.min(1, Math.max(0, t / CURRENT_EASE_IN));
  return x * x * (3 - 2 * x);
}

/** The stream function at plate point (x, y) and time t. Mirrors the shader's stream(). */
export function currentStream(x: number, y: number, t: number): number {
  return noise3(x * CURRENT_SCALE - CURRENT_DRIFT[0] * t, y * CURRENT_SCALE - CURRENT_DRIFT[1] * t, t * CURRENT_EVOLVE);
}

/**
 * The currents at plate point (x, y) and time t: where the content comes from, relative to the point, in plate
 * heights. The curl of the stream function, by central differences, eased in over the scene's first seconds.
 * Mirrors the shader's currents().
 */
export function currentsAt(x: number, y: number, t: number): { x: number; y: number } {
  const e = CURRENT_STEP;
  const k = (CURRENT_STRENGTH / (2 * e)) * currentEase(t);
  return {
    x: (currentStream(x, y + e, t) - currentStream(x, y - e, t)) * k,
    y: (currentStream(x - e, y, t) - currentStream(x + e, y, t)) * k,
  };
}

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
 *
 * Where the two layers differ, the crossfade shows both: a ghost of every bright cloud edge. They differ most
 * a quarter of a cycle from each restart, by the distance the content travels in half a cycle. So the turn
 * is that of a real vortex rather than a rigid one: rigid inside a small core, then the same speed along every
 * ring further out (the angle falls off as 1/r), and the inflow is a constant speed rather than a fraction of
 * the distance. A rigid turn of the whole 190 px reach would put the layers up to 24 px apart; this keeps
 * them within about 8.5 px.
 * - CYCLONE_CYCLE: seconds per layer cycle
 * - CYCLONE_SPIN: turn inside the core, radians per second
 * - CYCLONE_CORE: radius of the rigid core, plate heights (about 28 px on the master)
 * - CYCLONE_INFLOW: inward drift, plate heights per second (about 3.3 px/s on the master)
 */
export const CYCLONE_CYCLE = 3;
export const CYCLONE_SPIN = 0.16;
export const CYCLONE_CORE = 0.03;
export const CYCLONE_INFLOW = 0.0035;

/**
 * How far apart (plate heights) the two swirl layers' sample points are, at most, at distance `d` from the eye:
 * the turn and the inflow over half a cycle. Mirrors the shader; the ghost a crossfade can show is this wide.
 */
export function swirlLayerGap(d: number): number {
  const half = CYCLONE_CYCLE / 2;
  const turn = CYCLONE_SPIN * half * Math.min(1, CYCLONE_CORE / Math.max(d, 1e-6)) * d;
  return Math.hypot(turn, CYCLONE_INFLOW * half);
}

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
uniform vec2 uFlowCells;    // the fluid grid's columns and rows (fluidGridFor(): square cells over the canvas)
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
const float MAX_DISPLACEMENT = ${glslFloat(MAX_DISPLACEMENT)};
const float WAKE_GAIN = ${glslFloat(WAKE_GAIN)};
const float WAKE_BLUR = ${glslFloat(WAKE_BLUR)};

// The painted cyclone's eye and reach, in plate heights (plate.ts).
const vec2 CYCLONE = vec2(${glslFloat(LANDMARKS.cyclone.u * PLATE_ASPECT)}, ${glslFloat(LANDMARKS.cyclone.v)});
const float CYCLONE_REACH = ${glslFloat(LANDMARKS.cyclone.radius)};
const float CYCLONE_CYCLE = ${glslFloat(CYCLONE_CYCLE)};
const float CYCLONE_SPIN = ${glslFloat(CYCLONE_SPIN)};
const float CYCLONE_CORE = ${glslFloat(CYCLONE_CORE)};
const float CYCLONE_INFLOW = ${glslFloat(CYCLONE_INFLOW)};
const float CYCLONE_BREATH = ${glslFloat(CYCLONE_BREATH)};
const float CYCLONE_BREATH_PERIOD = ${glslFloat(CYCLONE_BREATH_PERIOD)};
const float TAU = 6.2831853;

// The ambient currents (see CURRENT_* in plate-shader.ts).
const float CURRENT_SCALE = ${glslFloat(CURRENT_SCALE)};
const vec2 CURRENT_DRIFT = vec2(${glslFloat(CURRENT_DRIFT[0])}, ${glslFloat(CURRENT_DRIFT[1])});
const float CURRENT_EVOLVE = ${glslFloat(CURRENT_EVOLVE)};
const float CURRENT_STRENGTH = ${glslFloat(CURRENT_STRENGTH)};
const float CURRENT_STEP = ${glslFloat(CURRENT_STEP)};
const float CURRENT_EASE_IN = ${glslFloat(CURRENT_EASE_IN)};

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

// The weather bands and the currents vary across the picture, so over the cloud emblem they would slowly bend it
// out of shape. A soft ellipse around it (with the mask, emblemWhole()) carries it whole instead.
float symbolCalm(vec2 q) {
  return 1.0 - smoothstep(0.85, 1.35, length((q - SYMBOL) / SYMBOL_HALF));
}

// How much of the plate at q (plate heights) is the cloud emblem, 0..1, from its soft mask. Until the mask
// has loaded the scene holds a 1 x 1 white texture, so everything counts as emblem and nothing turns.
float emblemAt(vec2 q) {
  return texture2D(uEmblem, vec2(q.x / PLATE_ASPECT, 1.0 - q.y)).r;
}

// How much of the plate at q rides with the cloud emblem as one piece, 0..1: the soft ellipse around it
// (symbolCalm), and its own strokes (the mask) where they reach past that ellipse, as the tail and the outer
// C's ends do. The ellipse gives a wide, gentle blend over the open ocean around the emblem; the mask makes
// sure no stroke is left half outside it.
float emblemWhole(vec2 q) {
  return max(symbolCalm(q), emblemAt(q));
}

vec2 weather(vec2 q) {
  vec2 bands = vec2(28.0 * (sin(uTime * 0.22 + q.y * 3.0) - sin(q.y * 3.0)),
                    12.0 * (sin(uTime * 0.18 + q.x * 3.0) - sin(q.x * 3.0)));
  float patches = smoothstep(0.35, 0.7, noise3(vec3(q * 2.4, 4.0)));
  return bands * patches * (1.0 - emblemWhole(q)) * pxToPlate();
}

// The currents' stream function at q: smooth noise whose field drifts across the planet and slowly changes.
float stream(vec2 q) {
  return noise3(vec3(q * CURRENT_SCALE - CURRENT_DRIFT * uTime, uTime * CURRENT_EVOLVE));
}

// The ambient currents at q, in plate heights: the curl of the stream function, so the flow is divergence-free
// and the clouds stream and curl without bunching up. They grow from nothing over the scene's first seconds,
// so its first frame is the still plate the fallback shows and it fades in without a jump. Mirrors currentsAt().
vec2 currents(vec2 q) {
  vec2 e = vec2(CURRENT_STEP, 0.0);
  float ease = smoothstep(0.0, CURRENT_EASE_IN, uTime);
  return vec2(stream(q + e.yx) - stream(q - e.yx), stream(q - e) - stream(q + e)) * (CURRENT_STRENGTH / (2.0 * CURRENT_STEP) * ease);
}

// One swirl layer of the cyclone at the given phase (0..1 through its cycle). The content at q has turned
// counter-clockwise (as seen) and drifted in toward the eye, by an amount that grows through the cycle from
// zero at its middle, fully over the inner 55% of the reach and not at all past it; so it came from a point
// turned back and pushed out. Returns that point relative to q. (In plate coordinates y points down, so a
// positive angle here turns clockwise as seen.)
//
// The turn is a real vortex's: rigid inside CYCLONE_CORE, then the same speed along every ring further out
// (the angle falls off as 1/r). The inflow is a constant speed, growing from nothing over the core so the eye
// never pinches. Both keep the two layers within a few pixels of each other (swirlLayerGap()), so their
// crossfade shows no ghost.
vec2 swirl(vec2 q, float phase) {
  vec2 r = q - CYCLONE;
  float d = length(r);
  if (d < 1e-5) return vec2(0.0);
  float body = 1.0 - smoothstep(0.55, 1.0, d / CYCLONE_REACH);
  float s = (phase - 0.5) * CYCLONE_CYCLE;
  float a = CYCLONE_SPIN * s * min(1.0, CYCLONE_CORE / d) * body;
  float c = cos(a), sn = sin(a);
  vec2 turned = vec2(c * r.x - sn * r.y, sn * r.x + c * r.y);
  float inward = CYCLONE_INFLOW * s * body * smoothstep(0.0, CYCLONE_CORE, d);
  // The emblem's upper stroke passes within about 100 px of the eye, inside the storm's painted reach: the
  // swirl leaves it alone, so it keeps its shape while the arms beside it turn.
  return (turned + r / d * inward - r) * (1.0 - emblemAt(q));
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
  vec2 step = WAKE_BLUR / uFlowCells;
  vec2 cells = (flowAt(at) * 2.0 + flowAt(at + vec2(step.x, 0.0)) + flowAt(at - vec2(step.x, 0.0))
    + flowAt(at + vec2(0.0, step.y)) + flowAt(at - vec2(0.0, step.y))) / 6.0;
  vec2 canvas = cells / uFlowCells * WAKE_GAIN;
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

// The currents at q, with the emblem carried whole: over it the currents are those at its centre, so it
// drifts with the flow around it and keeps its shape, while the clouds around it stream and curl.
vec2 emblemSafeCurrents(vec2 q) {
  float whole = emblemWhole(q);
  if (whole < 0.001) return currents(q);
  vec2 centre = currents(SYMBOL);
  return whole > 0.999 ? centre : mix(currents(q), centre, whole);
}

// Motion that every pixel shares, whatever the cyclone does: the drift, the weather, the ambient currents and
// the pointer wake. Sampling against the wake moves the content along it.
vec2 sharedMotion(vec2 q) {
  return orbital() + weather(q) + emblemSafeCurrents(q) - wake(q);
}

// A motion delta (where the content at this pixel comes from, relative to it) made safe for the limb: off in
// the calm band, eased in past it, and capped so it never reaches across it.
vec2 limbSafe(vec2 delta, float dist) {
  if (dist <= CALM_LIMB) return vec2(0.0);
  delta *= smoothstep(CALM_LIMB, FULL_MOTION, dist);
  float limit = (dist - CALM_LIMB) * 0.5;
  float travel = length(delta);
  return travel > limit ? delta * (limit / travel) : delta;
}

vec3 plateColor(vec2 uv) {
  // Textures are stored bottom row first.
  return texture2D(uPlate, vec2(uv.x, 1.0 - uv.y)).rgb;
}

// The plate's colour at q (plate heights) moved by everything, the cyclone's swirl as two crossfaded layers.
// The shared motion (with its many wake samples) is worked out once; only pixels within the cyclone's reach
// pay for the second plate sample.
vec3 movedColor(vec2 q, float dist) {
  // Nothing moves in the calm band or outside the limb (limbSafe() would zero it), so those pixels skip the
  // motion entirely: the currents' noise, the wake's texture reads and the cyclone's second sample. That is
  // the whole glow band and the band just inside the limb.
  if (dist <= CALM_LIMB) return plateColor(vec2(q.x / PLATE_ASPECT, q.y));
  vec2 shared = sharedMotion(q);
  if (length(q - CYCLONE) >= CYCLONE_REACH) {
    vec2 moved = q + limbSafe(shared, dist);
    return plateColor(vec2(moved.x / PLATE_ASPECT, moved.y));
  }
  float t = uTime / CYCLONE_CYCLE;
  float p1 = fract(t);
  float p2 = fract(t + 0.5);
  float w1 = 1.0 - abs(2.0 * p1 - 1.0);
  vec2 storm = shared + breathe(q);
  vec2 m1 = q + limbSafe(storm + swirl(q, p1), dist);
  vec2 m2 = q + limbSafe(storm + swirl(q, p2), dist);
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
