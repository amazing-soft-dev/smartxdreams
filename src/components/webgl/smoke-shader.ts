/**
 * Shaders for the footer smoke: domain-warped fractal Brownian motion (fBm) value noise, tinted with the
 * brand violet and a touch of coral, and faded out toward the top and bottom edges. WebGL 1 / GLSL ES 1.0
 * so it runs on every device that has WebGL at all.
 */

export const smokeVertexShader = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const smokeFragmentShader = /* glsl */ `
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;
uniform float uScale;
uniform float uFade;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.02 + 1.7;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = vec2(uv.x * uResolution.x / uResolution.y, uv.y) * uScale;
  float t = uTime * 0.04;

  // Two rounds of domain warping give the slow, folding smoke shapes.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float n = fbm(p + 2.5 * r);

  float density = smoothstep(0.35, 0.95, n) * uIntensity;
  vec3 color = mix(uColorA, uColorB, clamp(r.x * 1.4 - 0.2, 0.0, 1.0));

  // Fade toward the top and bottom so the smoke never meets the edges of the footer with a hard line.
  float edge = smoothstep(0.0, uFade, uv.y) * smoothstep(0.0, uFade, 1.0 - uv.y);
  float alpha = clamp(density * edge, 0.0, 1.0);

  gl_FragColor = vec4(color * alpha, alpha);
}
`;
