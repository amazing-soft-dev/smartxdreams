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
 * The cyclone turns around its eye, forward and then back, as on generalcontextlabs.com: the storm is turned
 * by an angle that swings slowly one way and the other, rigidly inside a core around the eye and less and
 * less out to the edge of its painted arms. Further from the eye the arms lag behind the core, so the spiral
 * winds a little tighter as it turns forward and unwinds as it turns back.
 *
 * It replaces a turn that spun one way without end, with the clouds drifting in toward the eye and the whole
 * spiral breathing in and out. To spin without end the picture had to be turned in two crossfaded layers
 * that restart every few seconds, and the inflow and the breath moved every cloud toward or away from one
 * point: on screen that read as the picture zooming into the eye and out again, an image expander rather
 * than clouds. A turn by an angle that depends only on the distance from the eye moves every cloud along its
 * own ring, so no cloud grows, shrinks or ghosts, and one sample of the plate is enough.
 * - CYCLONE_TURN, CYCLONE_TURN_RATE: the main swing, radians, and its rate, radians per second (a 39 s swing)
 * - CYCLONE_SWAY, CYCLONE_SWAY_RATE: a smaller, quicker swing on top (27 s), so the turn never repeats exactly
 * - CYCLONE_CORE: the rigid core, as a fraction of the reach (about 38 px of the 190 px on the master)
 */
export const CYCLONE_TURN = 0.19;
export const CYCLONE_TURN_RATE = 0.16;
export const CYCLONE_SWAY = 0.035;
export const CYCLONE_SWAY_RATE = 0.23;
export const CYCLONE_CORE = 0.2;

/** The cyclone's turn at time `t` (seconds), in radians, inside its core; zero at t = 0. Mirrors the shader. */
export function cycloneAngle(t: number): number {
  return CYCLONE_TURN * Math.sin(t * CYCLONE_TURN_RATE) + CYCLONE_SWAY * Math.sin(t * CYCLONE_SWAY_RATE);
}

/** How much of the turn reaches `d` plate heights from the eye: all of it in the core, none past the reach. */
export function cycloneBody(d: number): number {
  const reach = LANDMARKS.cyclone.radius;
  const x = Math.min(1, Math.max(0, (d - CYCLONE_CORE * reach) / (reach - CYCLONE_CORE * reach)));
  return 1 - x * x * (3 - 2 * x);
}

/**
 * The cyclone at plate point (x, y) (plate heights, y down) and time `t`: where the content there comes from,
 * relative to the point. Mirrors the shader's cyclone(), without the emblem mask.
 */
export function cycloneAt(x: number, y: number, t: number): { x: number; y: number } {
  const rx = x - LANDMARKS.cyclone.u * PLATE_ASPECT;
  const ry = y - LANDMARKS.cyclone.v;
  const a = cycloneAngle(t) * cycloneBody(Math.hypot(rx, ry));
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: c * rx - s * ry - rx, y: s * rx + c * ry - ry };
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
const float CYCLONE_TURN = ${glslFloat(CYCLONE_TURN)};
const float CYCLONE_TURN_RATE = ${glslFloat(CYCLONE_TURN_RATE)};
const float CYCLONE_SWAY = ${glslFloat(CYCLONE_SWAY)};
const float CYCLONE_SWAY_RATE = ${glslFloat(CYCLONE_SWAY_RATE)};
const float CYCLONE_CORE = ${glslFloat(CYCLONE_CORE)};

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

// The weather bands vary across the picture, so over the cloud emblem they would slowly bend it out of shape. A soft ellipse around it (with the mask, emblemWhole()) carries it whole instead.
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

// The cyclone at q: where the content comes from, relative to q. The storm is turned around its eye by an
// angle that swings forward and back (cycloneAngle()), rigidly inside the core and fading to nothing at the
// edge of its painted arms, so each cloud moves along its own ring and none grows, shrinks or ghosts. Zero at
// t = 0. Mirrors cycloneAt().
vec2 cyclone(vec2 q) {
  vec2 r = q - CYCLONE;
  float d = length(r);
  if (d >= CYCLONE_REACH) return vec2(0.0);
  float body = 1.0 - smoothstep(CYCLONE_CORE * CYCLONE_REACH, CYCLONE_REACH, d);
  // The emblem's upper stroke passes within about 100 px of the eye, inside the storm's painted reach: the
  // turn leaves it alone, so it keeps its shape while the arms beside it turn.
  float a = (CYCLONE_TURN * sin(uTime * CYCLONE_TURN_RATE) + CYCLONE_SWAY * sin(uTime * CYCLONE_SWAY_RATE)) * body * (1.0 - emblemAt(q));
  float c = cos(a), s = sin(a);
  return vec2(c * r.x - s * r.y, s * r.x + c * r.y) - r;
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

// Motion that every pixel shares, whatever the cyclone does: the drift, the weather and the pointer wake.
// Sampling against the wake moves the content along it.
vec2 sharedMotion(vec2 q) {
  return orbital() + weather(q) - wake(q);
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

// The plate's colour at q (plate heights) moved by everything: one sample of the plate.
vec3 movedColor(vec2 q, float dist) {
  // Nothing moves in the calm band or outside the limb (limbSafe() would zero it), so those pixels skip the
  // motion entirely: the weather's noise and the wake's texture reads. That is the whole glow band and the
  // band just inside the limb.
  if (dist <= CALM_LIMB) return plateColor(vec2(q.x / PLATE_ASPECT, q.y));
  vec2 moved = q + limbSafe(sharedMotion(q) + cyclone(q), dist);
  return plateColor(vec2(moved.x / PLATE_ASPECT, moved.y));
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
