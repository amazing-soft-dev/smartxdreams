/**
 * Shaders for the footer aurora, drawn as seen from the ground: curtains of light that rise from just above
 * the horizon, fold and sway along their length, and are combed into fine vertical rays. Each curtain has
 * a bright lower edge that fades upward and shifts from the `low` colour at its base to the `high` colour at
 * its top, as a real aurora goes from green at the bottom to red at the top. Three layers at different
 * depths breathe (height and brightness) on slow loops of different lengths, after Black Jupiter's
 * pillars, so the sky keeps changing with nobody touching it. A soft skyglow lies along the horizon.
 * Near the cursor the curtains lean toward it and brighten, more toward their tops than at their bases.
 * WebGL 1 / GLSL ES 1.0 so it runs on every device that has WebGL at all.
 */

export const auroraVertexShader = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const auroraFragmentShader = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
/** Brand colours of the curtains' lower edge and upper fringe (sRGB 0-1), updated every frame. */
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
/** Overall strength, 0 to 2. */
uniform float uIntensity;
/** Height of the horizon line, 0 (bottom) to 1 (top). */
uniform float uHorizon;
/** How far down from the top edge the aurora fades out, 0 to 1. */
uniform float uFade;
/** The eased cursor, 0 to 1 with y up, and how present it is (0 when away, 1 when over the footer). */
uniform vec2 uPointer;
uniform float uPointerStrength;

const float TAU = 6.2831853;

float hash(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

/** Smooth 1D value noise, 0 to 1. */
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}

/** Slowly swaying horizontal position along a curtain: folds that drift sideways and bend. */
float fold(float x, float t, float seed, float speed) {
  return x
    + 0.32 * sin(x * 0.85 + t * 0.07 * speed + seed)
    + 0.22 * (noise(x * 0.6 - t * 0.05 * speed + seed * 7.0) - 0.5);
}

/**
 * One curtain layer at (x, y), x in height units. Returns its brightness (rgb premultiplied, a) so the
 * layers can be added. base and height are the layer's resting base line and ray height above the horizon.
 */
vec4 curtain(float x, float y, float t, float seed, float speed, float base, float height, float weight) {
  float xw = fold(x, t, seed, speed);

  // Breathing: loops of 8.7, 11.3 and 12.7 s (Black Jupiter's at speed 1.5), offset per layer.
  float breathe = sin(t * TAU / (8.7 + seed * 0.37) + seed);
  float pulse = sin(t * TAU / (11.3 + seed * 0.53) + seed * 2.1);
  float lift = sin(t * TAU / (12.7 + seed * 0.29) + seed * 3.7);

  // The base line drapes along the curtain, so the lower edge curves instead of running flat, and the whole
  // curtain rises and falls a little.
  float b = uHorizon + base
    + 0.07 * (noise(xw * 1.1 + t * 0.04 * speed + seed * 13.0) - 0.5)
    + 0.025 * sin(xw * 2.3 + t * 0.09 * speed + seed * 5.0)
    + 0.012 * lift;
  float h = height * (1.0 + 0.08 * breathe);

  // Fine vertical rays: two scales of noise across the curtain, sharpened, and drifting slowly.
  float rays = 0.6 * noise(xw * 16.0 + seed * 31.0 + t * 0.12) + 0.4 * noise(xw * 41.0 - t * 0.35 + seed);
  rays = rays * rays * (3.0 - 2.0 * rays);

  // Where along its length the curtain is lit: patches that grow, fade and travel.
  float band = smoothstep(0.28, 0.78, noise(xw * 1.15 + t * 0.03 * speed + seed * 3.0));

  float d = y - b;
  // Soft lower edge, then a long fade upward; brighter rays reach higher. The edge is a few pixels soft at
  // the canvas's half resolution, so it never steps.
  float rayHeight = h * (0.65 + 0.7 * rays);
  float vertical = exp(-max(d, 0.0) / rayHeight) * smoothstep(-0.06, 0.015, d);

  float a = weight * band * (0.3 + 0.7 * rays) * vertical * (1.0 + 0.1 * pulse);
  vec3 color = mix(uColorLow, uColorHigh, clamp(d / (h * 1.5), 0.0, 1.0));
  return vec4(color * a, a);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  // x in units of the footer's height, so folds keep their shape at any width. A tall phone footer would
  // stretch a single fold across the screen, so narrow screens get at least the folds of a 1.2:1 box.
  float aspect = max(uResolution.x / uResolution.y, 1.2);
  float x = uv.x * aspect;
  float y = uv.y;
  float t = uTime;

  // The cursor's pull: a soft round falloff around it, about a quarter of the footer's width across (in
  // height units, kept between 0.3 and 0.6). The curtains are sampled from a little further from the
  // cursor, which draws their folds toward it, and the light within the falloff rises. The pull grows with
  // height above the horizon, so the curtains bend from their bases like hanging cloth.
  float px = uPointer.x * aspect;
  float radius = clamp(0.22 * aspect, 0.3, 0.6);
  vec2 toPointer = vec2(px - x, (uPointer.y - y) * 0.7);
  float pull = exp(-dot(toPointer, toPointer) / (radius * radius)) * uPointerStrength;
  float bendWeight = smoothstep(uHorizon, uHorizon + 0.35, y);
  x -= toPointer.x * pull * 0.35 * bendWeight;

  // Far to near: lower, shorter, dimmer and slower in the distance.
  vec4 sum = curtain(x * 1.6, y, t, 1.0, 0.6, 0.015, 0.16, 0.45);
  sum += curtain(x * 1.2, y, t, 2.0, 0.85, 0.035, 0.27, 0.7);
  sum += curtain(x, y, t, 3.0, 1.0, 0.055, 0.38, 1.0);
  sum *= 1.0 + 0.3 * pull;

  // Skyglow along the horizon, in the lower edge's colour, breathing on a 7.3 s loop.
  float glow = exp(-abs(y - uHorizon) * 9.0) * 0.32 * (0.85 + 0.15 * sin(t * TAU / 7.3));
  sum += vec4(uColorLow * glow, glow);

  // Fade out toward the top edge, and below the horizon line.
  float fade = smoothstep(1.0, 1.0 - uFade, y) * smoothstep(uHorizon - 0.12, uHorizon, y);

  // Soft knee: faint light passes almost unchanged, while bright spots (where curtains overlap at their
  // bases) level off below 0.6 instead of clipping to white, so the footer text over them stays legible.
  float raw = sum.a * uIntensity * fade;
  float alpha = 0.6 * (1.0 - exp(-raw * 1.7));
  vec3 color = min(sum.rgb * uIntensity * fade * (alpha / max(raw, 0.0001)), vec3(alpha));
  gl_FragColor = vec4(color, alpha);
}
`;
