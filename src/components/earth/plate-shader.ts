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

import { HORIZON, PLATE_ASPECT } from "./plate";

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

/** How far (plate heights) the painted atmosphere glow is kept outside the limb before it fades out. */
export const GLOW_BAND = 0.06;

export const plateFragmentShader = /* glsl */ `
uniform sampler2D uPlate;
uniform vec4 uPlateRect;    // the plate's left, bottom, width and height, in hero heights
uniform vec2 uResolution;   // canvas size in CSS px
uniform float uReady;       // 1 once the plate texture has loaded
uniform vec4 uSky;          // what shows outside the planet and its glow (premultiplied; alpha 0 lets the page show)
uniform float uTime;        // seconds the scene has been running

varying vec2 vUv;

${horizonChunk}
${noiseChunk}

const float GLOW_BAND = ${glslFloat(GLOW_BAND)};
const float CALM_LIMB = ${glslFloat(CALM_LIMB)};
const float FULL_MOTION = ${glslFloat(FULL_MOTION)};

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

vec2 weather(vec2 q) {
  vec2 bands = vec2(28.0 * (sin(uTime * 0.22 + q.y * 3.0) - sin(q.y * 3.0)),
                    12.0 * (sin(uTime * 0.18 + q.x * 3.0) - sin(q.x * 3.0)));
  float patches = smoothstep(0.35, 0.7, noise3(vec3(q * 2.4, 4.0)));
  return bands * patches * pxToPlate();
}

// Where the content at q comes from, relative to q, eased in from the calm band and capped so it never
// reaches across it.
vec2 motion(vec2 q, float dist) {
  if (dist <= CALM_LIMB) return vec2(0.0);
  vec2 delta = (orbital() + weather(q)) * smoothstep(CALM_LIMB, FULL_MOTION, dist);
  float limit = (dist - CALM_LIMB) * 0.5;
  float travel = length(delta);
  return travel > limit ? delta * (limit / travel) : delta;
}

vec3 plateColor(vec2 uv) {
  // Textures are stored bottom row first.
  return texture2D(uPlate, vec2(uv.x, 1.0 - uv.y)).rgb;
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
  vec2 moved = q + motion(q, dist);
  vec3 color = plateColor(vec2(moved.x / PLATE_ASPECT, moved.y));
  float alpha = 1.0;
  if (dist < 0.0) {
    // In the sky: the painted glow is bright and the painted sky is black, so brightness is the glow's
    // coverage. It also fades out across the band, which drops the painted stars beyond it.
    float glow = clamp(max(color.r, max(color.g, color.b)) * 1.25, 0.0, 1.0);
    alpha = glow * smoothstep(-GLOW_BAND, -0.008, dist);
  }
  // Premultiplied: the plate over the sky.
  gl_FragColor = vec4(color * alpha, alpha) + uSky * (1.0 - alpha);
}
`;
