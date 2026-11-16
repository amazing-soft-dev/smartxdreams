/** Point shaders for AstraField: soft round sprites, per-star twinkle and size attenuation with depth. */

export const starVertexShader = /* glsl */ `
attribute vec3 color;
attribute float size;
attribute float phase;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation: nearer stars are drawn larger.
  gl_PointSize = size * uPixelRatio * (6.0 / -mvPosition.z);

  // Slow twinkle, each star on its own phase and speed.
  vTwinkle = 0.65 + 0.35 * sin(uTime * (0.6 + fract(phase) * 1.4) + phase);
  vColor = color;
}
`;

export const starFragmentShader = /* glsl */ `
precision mediump float;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  // Soft round sprite: bright core, smooth falloff, nothing outside the circle.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.0, d);
  alpha *= alpha * vTwinkle;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor * alpha, alpha);
}
`;
