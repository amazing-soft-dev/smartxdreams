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
import {
  EMBLEM_REGION_RANGE,
  emblemDistance,
  GLOW_BAND,
  GLOW_EDGE,
  GLOW_RISE,
  HORIZON,
  LANDMARKS,
  PLATE,
  PLATE_ASPECT,
  SKY_FLOOR,
} from "./plate";

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

/**
 * Plate heights per screen pixel for motion sized in pixels: screen pixels, but never more than a pixel of the
 * master, so a plate drawn smaller than the master (on a phone) is moved no further, for its size, than the
 * master is. Mirrors the shader's motionPx(); `pxToPlate` is plate heights per screen pixel at the current size.
 */
export const MASTER_PX = 1 / PLATE.height;
export function motionPx(pxToPlate: number): number {
  return Math.min(pxToPlate, MASTER_PX);
}

/**
 * Weather systems: as on generalcontextlabs.com, the clouds move as whole systems over the open ocean, where the
 * painted clouds are thickest, and the land stays put. In each system the plate slides as bands: the sideways
 * slide varies with height and the up-and-down slide with x, so neighbouring bands shear past one another and
 * the clouds stream rather than stretch. Each slide is a difference of sines from t = 0, so it starts at zero
 * and stays bounded.
 *
 * It replaces curl-noise currents that warped the whole planet, coasts and land included, and bands switched on
 * in small noise patches, whose sharp edges stretched and squeezed the clouds as they slid (patches of cloud
 * changed area by up to 44% at their edges; now at most about 15%, and 2% on average).
 * - WEATHER_BANDS: how far the bands slide, sideways and up and down, in pixels (see motionPx()); the
 *   difference of two sines doubles it at most
 * - WEATHER_RATES: their rates, radians per second (29 s and 35 s)
 * - WEATHER_WAVE: how fast the slide varies across the plate, radians per plate height
 * - WEATHER_SYSTEMS: each system's centre and size (half its extent) in plate heights, x right and y down: the
 *   cloud fields over the Pacific at the lower left and over the open Atlantic below the emblem. (The clouds
 *   over the Atlantic coast, beside the emblem, drift with the emblem: EMBLEM_DRIFT.) A system's strength falls
 *   off as exp(-2 d²) in its own size, so it fades out over most of its size and the slide never stops at an
 *   edge. The systems are wider than tall because the sideways slide is the larger one: a slide squeezes or
 *   stretches clouds where the system fades along it, so it fades slowly that way.
 */
export const WEATHER_BANDS = [24, 10] as const;
export const WEATHER_RATES = [0.22, 0.18] as const;
export const WEATHER_WAVE = 2;
export const WEATHER_SYSTEMS = [
  { name: "pacific", x: 0.42, y: 0.85, width: 0.6, height: 0.22 },
  { name: "atlantic", x: 1.62, y: 0.86, width: 0.5, height: 0.2 },
] as const;

/** How strongly the weather moves the plate at (x, y), 0..1: the strongest system there. Mirrors weatherField(). */
export function weatherField(x: number, y: number): number {
  let most = 0;
  for (const s of WEATHER_SYSTEMS) {
    const dx = (x - s.x) / s.width;
    const dy = (y - s.y) / s.height;
    most = Math.max(most, Math.exp(-2 * (dx * dx + dy * dy)));
  }
  return most;
}

/** The bands' slide at (x, y) and time t, in pixels, before any system's strength. Mirrors bands(). */
export function weatherBands(x: number, y: number, t: number): { x: number; y: number } {
  return {
    x: WEATHER_BANDS[0] * (Math.sin(t * WEATHER_RATES[0] + y * WEATHER_WAVE) - Math.sin(y * WEATHER_WAVE)),
    y: WEATHER_BANDS[1] * (Math.sin(t * WEATHER_RATES[1] + x * WEATHER_WAVE) - Math.sin(x * WEATHER_WAVE)),
  };
}

/**
 * The weather at plate point (x, y) and time t: where the content comes from, relative to the point, in plate
 * heights, at `px` plate heights per pixel (the master by default). Mirrors weather(), without the emblem.
 */
export function weatherAt(x: number, y: number, t: number, px = MASTER_PX): { x: number; y: number } {
  const b = weatherBands(x, y, t);
  const k = weatherField(x, y) * px;
  return { x: b.x * k, y: b.y * k };
}

/**
 * The cloud emblem drifts, as the cloud forms on generalcontextlabs.com flow with the weather: as one rigid piece,
 * on its own slow sines, so it moves visibly while every stroke keeps its shape. The plate near it drifts with it
 * and fades back to the weather with distance from the strokes (the emblem mask, emblemDistance()), so
 * the open ocean between and around the strokes moves with the emblem and nothing tears at a stroke's edge.
 * Read pixel by pixel instead, the weather bent the strokes apart, so until now the emblem was calmed and only
 * followed the slow orbital drift: it looked static.
 * - EMBLEM_DRIFT: how far it drifts, sideways and up and down, in pixels (see motionPx())
 * - EMBLEM_DRIFT_RATES: the rates, radians per second (31 s and 42 s); sines from zero, so still at t = 0
 * - EMBLEM_FADE: over how many plate heights from the strokes the plate fades from the emblem's drift back to the
 *   weather (about 240 px on the master). Shorter squeezes the clouds in between; longer drags the coast of
 *   Florida and the Carolinas, the land nearest the emblem, along with it (now under two fifths of the drift).
 */
export const EMBLEM_DRIFT = [16, 7] as const;
export const EMBLEM_DRIFT_RATES = [0.2, 0.15] as const;
export const EMBLEM_FADE = 0.25;

/** How much of the plate at (x, y) drifts with the emblem, 0..1: all of it on the strokes. Mirrors emblemWhole(). */
export function emblemWholeAt(x: number, y: number): number {
  const s = Math.min(1, emblemDistance(x, y) / EMBLEM_FADE);
  return 1 - s * s * (3 - 2 * s);
}

/** The emblem's drift at time t, in plate heights at `px` plate heights per pixel. Mirrors emblemDrift(). */
export function emblemDrift(t: number, px = MASTER_PX): { x: number; y: number } {
  return {
    x: EMBLEM_DRIFT[0] * Math.sin(t * EMBLEM_DRIFT_RATES[0]) * px,
    y: EMBLEM_DRIFT[1] * Math.sin(t * EMBLEM_DRIFT_RATES[1]) * px,
  };
}

/**
 * The slow motion at plate point (x, y) and time t without the cyclone, the orbital drift or the pointer: the
 * weather, giving way to the emblem's drift near the emblem. Mirrors the shader's mix in sharedMotion().
 */
export function ambientAt(x: number, y: number, t: number, px = MASTER_PX): { x: number; y: number } {
  const w = weatherAt(x, y, t, px);
  const d = emblemDrift(t, px);
  const k = emblemWholeAt(x, y);
  return { x: w.x + (d.x - w.x) * k, y: w.y + (d.y - w.y) * k };
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
 * relative to the point. Mirrors the shader's cyclone().
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
uniform sampler2D uEmblem;  // distance from the cloud emblem's strokes over the plate (earth-emblem-mask.png)

varying vec2 vUv;

${horizonChunk}

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

// The weather systems (see WEATHER_* in plate-shader.ts): how far and how fast the bands slide, and each
// system's centre and size (half its extent), in plate heights.
const vec2 WEATHER_BANDS = vec2(${glslFloat(WEATHER_BANDS[0])}, ${glslFloat(WEATHER_BANDS[1])});
const vec2 WEATHER_RATES = vec2(${glslFloat(WEATHER_RATES[0])}, ${glslFloat(WEATHER_RATES[1])});
const float WEATHER_WAVE = ${glslFloat(WEATHER_WAVE)};
${WEATHER_SYSTEMS.map((s, i) => `const vec4 WEATHER_SYSTEM_${i} = vec4(${[s.x, s.y, s.width, s.height].map(glslFloat).join(", ")}); // ${s.name}`).join("\n")}
const float MASTER_PX = ${glslFloat(MASTER_PX)};

// The emblem's drift (see EMBLEM_* in plate-shader.ts), and the distance the emblem mask spans.
const vec2 EMBLEM_DRIFT = vec2(${glslFloat(EMBLEM_DRIFT[0])}, ${glslFloat(EMBLEM_DRIFT[1])});
const vec2 EMBLEM_DRIFT_RATES = vec2(${glslFloat(EMBLEM_DRIFT_RATES[0])}, ${glslFloat(EMBLEM_DRIFT_RATES[1])});
const float EMBLEM_FADE = ${glslFloat(EMBLEM_FADE)};
const float EMBLEM_REGION_RANGE = ${glslFloat(EMBLEM_REGION_RANGE)};

// Motion works in plate heights, x right and y down: q = (u * PLATE_ASPECT, v).

// Converts screen pixels to plate heights at the current size.
float pxToPlate() {
  return 1.0 / (uResolution.y * uPlateRect.w);
}

// The slow drift of the whole globe, in plate heights, small at every size; zero at t = 0, as on the reference.
vec2 orbital() {
  return vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043)) * pxToPlate();
}

// How much of the plate at q drifts with the cloud emblem as one piece, 0..1: all of it on the strokes, fading
// out over EMBLEM_FADE plate heights from them (the emblem mask is that distance, white at EMBLEM_REGION_RANGE).
// The placeholder's white reads as far away, so nothing drifts with the emblem until the mask has loaded.
// Mirrors emblemWholeAt().
float emblemWhole(vec2 q) {
  float distance = texture2D(uEmblem, vec2(q.x / PLATE_ASPECT, 1.0 - q.y)).r * EMBLEM_REGION_RANGE;
  return 1.0 - smoothstep(0.0, EMBLEM_FADE, distance);
}

// How strongly one weather system (centre and size) moves the plate at q: exp(-2 d^2), d in its own size.
float weatherSystem(vec2 q, vec4 system) {
  vec2 d = (q - system.xy) / system.zw;
  return exp(-2.0 * dot(d, d));
}

// How strongly the weather moves the plate at q, 0..1: the strongest system there. Mirrors weatherField().
float weatherField(vec2 q) {
  return ${WEATHER_SYSTEMS.slice(1).reduce((acc, _, i) => `max(${acc}, weatherSystem(q, WEATHER_SYSTEM_${i + 1}))`, "weatherSystem(q, WEATHER_SYSTEM_0)")};
}

// The bands' slide at q, in pixels: sideways varying with height and up and down varying with x, so bands
// shear past one another; differences of sines from t = 0, so zero at the start and bounded. Mirrors
// weatherBands().
vec2 bands(vec2 q) {
  return WEATHER_BANDS * vec2(sin(uTime * WEATHER_RATES.x + q.y * WEATHER_WAVE) - sin(q.y * WEATHER_WAVE),
                              sin(uTime * WEATHER_RATES.y + q.x * WEATHER_WAVE) - sin(q.x * WEATHER_WAVE));
}

// Plate heights per pixel for motion sized in pixels: screen pixels, but never more than a pixel of the master,
// so a plate drawn smaller than the master is moved no further, for its size. Mirrors motionPx().
float motionPx() {
  return min(pxToPlate(), MASTER_PX);
}

// The weather at q, in plate heights: whole cloud systems sliding over the open ocean, as on the reference,
// and the land left still. Mirrors weatherAt().
vec2 weather(vec2 q) {
  return bands(q) * weatherField(q) * motionPx();
}

// The emblem's drift, in plate heights: one slide for the whole emblem, sines from t = 0. Mirrors emblemDrift().
vec2 emblemDrift() {
  return EMBLEM_DRIFT * vec2(sin(uTime * EMBLEM_DRIFT_RATES.x), sin(uTime * EMBLEM_DRIFT_RATES.y)) * motionPx();
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
  // Everything in the storm's reach turns with it, as on the reference, the emblem's upper stroke (about 100 px
  // from the eye) included.
  float a = (CYCLONE_TURN * sin(uTime * CYCLONE_TURN_RATE) + CYCLONE_SWAY * sin(uTime * CYCLONE_SWAY_RATE)) * body;
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

// Motion that every pixel shares, whatever the cyclone does: the orbital drift, the weather giving way to the
// emblem's drift near the emblem, and the pointer wake. The wake is read at this pixel, on the emblem as
// anywhere else, as on the reference: the cursor bends and swirls the emblem's clouds where it passes, like
// any other clouds. Sampling against the wake moves the content along it.
vec2 sharedMotion(vec2 q) {
  return orbital() + mix(weather(q), emblemDrift(), emblemWhole(q)) - wakeAt(vUv);
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
  // motion entirely: the weather and the wake's texture reads. That is the whole glow band and the
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
