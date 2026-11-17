/**
 * Shaders for the Earth backdrop behind the Home hero.
 *
 * The planet is drawn in two passes. `planetFragmentShader` paints the whole backdrop (sky, stars, the planet,
 * its atmosphere and the sunrise on the limb) from procedural noise. It is costly, so the scene runs it only
 * when the canvas size changes and keeps the result in a texture. `composeFragmentShader` draws that texture
 * every frame, which is cheap, and adds the SmartxDreams symbol in cloud on top; anything that moves goes there.
 *
 * Coordinates: `p` is in hero heights with the origin at the bottom-left, so x runs from 0 to width/height.
 * The planet is a circle (`uPlanet`: centre x, centre y, radius) and the sun a direction (`uSun`), both from
 * layout.ts for the breakpoint in force. Colours are sRGB values and
 * go to the canvas as they are.
 */

/** Full-screen quad: a 2 x 2 plane drawn straight to clip space, so the camera does not matter. */
export const earthVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Value noise and fractal noise in 3D. Sampling on the sphere's surface avoids seams and pole pinching. */
const noise = /* glsl */ `
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

// Each octave is rotated so the lattice of one octave never lines up with the next.
const mat3 OCTAVE = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * noise3(p);
    p = OCTAVE * p * 2.02;
    amp *= 0.5;
  }
  return sum / 0.96875;
}
`;

/** The palette. The atmosphere and the sunrise take the brand's violet and coral. */
const palette = /* glsl */ `
const vec3 INK = vec3(0.059, 0.071, 0.149);        // ink #0F1226, the hero background
const vec3 NAVY = vec3(0.071, 0.133, 0.302);       // deep blue sky near the planet
const vec3 OCEAN_DEEP = vec3(0.039, 0.153, 0.400);
const vec3 OCEAN = vec3(0.090, 0.298, 0.639);
const vec3 SHALLOW = vec3(0.180, 0.553, 0.690);
const vec3 LAND_GREEN = vec3(0.310, 0.490, 0.239);
const vec3 LAND_OLIVE = vec3(0.533, 0.573, 0.314);
const vec3 LAND_SAND = vec3(0.820, 0.655, 0.420);
const vec3 ICE = vec3(0.900, 0.925, 0.965);
const vec3 CLOUD_SUN = vec3(1.000, 0.965, 0.925);
const vec3 CLOUD_SHADE = vec3(0.560, 0.610, 0.780);
const vec3 AIR = vec3(0.420, 0.600, 1.000);
const vec3 VIOLET = vec3(0.545, 0.439, 1.000);      // violet-400 #8B70FF
const vec3 CORAL = vec3(1.000, 0.518, 0.341);       // coral-400 #FF8457
const vec3 DAWN = vec3(1.000, 0.870, 0.690);
`;

export const planetFragmentShader = /* glsl */ `
uniform vec2 uResolution;  // canvas size in CSS px
uniform vec3 uPlanet;      // centre x, centre y and radius, in hero heights from the bottom-left
uniform vec3 uSun;         // unit vector toward the sun in view space: x right, y up, z toward the viewer

varying vec2 vUv;

${noise}
${palette}

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

mat3 rotateZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
}

// Colour of the planet's surface (with its weather) at view-space normal n, lit by the sun.
vec3 surface(vec3 n) {
  // Globe coordinates: tip the north pole toward the viewer and lean it left, so the visible cap shows the
  // northern hemisphere at an angle, as from a low orbit.
  vec3 q = rotateZ(0.42) * rotateX(0.95) * n;
  // Warp the lookup so coasts and weather swirl instead of looking like plain noise.
  vec3 w = q + 0.45 * (vec3(fbm(q * 1.8 + 11.0), fbm(q * 1.8 + 23.0), fbm(q * 1.8 + 37.0)) - 0.5);
  float height = fbm(w * 3.1);
  float latitude = abs(q.y);

  // Painted texture: noise stretched along the meridians reads as brush strokes at hero scale.
  float stroke = noise3(vec3(q.x * 60.0, q.y * 150.0, q.z * 60.0)) - 0.5;

  float land = smoothstep(0.535, 0.545, height);
  float shelf = smoothstep(0.5, 0.535, height) * (1.0 - land);
  vec3 sea = mix(OCEAN_DEEP, OCEAN, smoothstep(0.18, 0.5, height) + stroke * 0.07);
  sea = mix(sea, SHALLOW, shelf * shelf * 0.45);

  float dry = smoothstep(0.48, 0.7, fbm(w * 3.1 + 5.0)) * (1.0 - smoothstep(0.3, 0.55, latitude));
  vec3 ground = mix(LAND_GREEN, LAND_OLIVE, fbm(w * 7.0));
  ground = mix(ground, LAND_SAND, dry);
  ground *= 1.0 - 0.3 * smoothstep(0.6, 0.75, height);  // highlands read darker
  ground += stroke * 0.035;

  float ice = smoothstep(0.80, 0.87, latitude + (fbm(q * 6.0) - 0.5) * 0.12);
  ground = mix(ground, ICE, ice);
  sea = mix(sea, ICE, ice * 0.85);
  vec3 color = mix(sea, ground, land);

  // Weather: cloud bands that follow the latitude, broken up by warped noise.
  // Two scales: broad systems, and the small puffs and streets of cumulus that break them up.
  float cover = fbm(w * 4.6 + vec3(0.0, fbm(q * 2.0) * 1.5, 0.0));
  float bands = 0.55 + 0.45 * sin(q.y * 13.0 + fbm(q * 2.5) * 4.0);
  float puffs = fbm(w * 16.0 + 4.0);
  float cloud = smoothstep(0.5, 0.66, cover * (0.72 + 0.36 * bands) + (puffs - 0.5) * 0.32) * 0.92;

  float diffuse = max(dot(n, uSun), 0.0);
  color *= 0.24 + 0.9 * diffuse;
  // A glint of sun on open water.
  vec3 halfway = normalize(uSun + vec3(0.0, 0.0, 1.0));
  color += DAWN * pow(max(dot(n, halfway), 0.0), 240.0) * (1.0 - land) * (1.0 - cloud) * 0.3;
  // Thicker cloud is brighter on top, so each puff has a lit crown and a shaded base.
  vec3 cloudColor = mix(CLOUD_SHADE, CLOUD_SUN, smoothstep(-0.1, 0.8, diffuse) * (0.65 + 0.35 * puffs));
  color = mix(color, cloudColor, cloud);

  // The atmosphere thickens toward the limb.
  float rim = pow(1.0 - n.z, 2.2);
  return mix(color, mix(AIR, VIOLET, 0.35), rim * 0.45);
}

void main() {
  vec2 p = vUv * vec2(uResolution.x / uResolution.y, 1.0);
  vec2 d = p - uPlanet.xy;
  float r = length(d) / uPlanet.z;                   // 1.0 on the limb
  float aa = 1.5 / (uResolution.y * uPlanet.z);      // about 1.5 px, in radii
  vec2 dir = d / max(length(d), 1e-5);
  vec2 sunDir = normalize(uSun.xy);
  // How much this part of the limb faces the sun: the sunrise side glows coral, the rest violet.
  float warm = pow(max(dot(dir, sunDir), 0.0), 4.0);
  vec3 glow = mix(VIOLET, mix(CORAL, DAWN, 0.35), warm);

  // Sky: ink, turning deep blue toward the planet. Distances from the limb are in hero heights, so the glow
  // is the same width whatever the planet's radius.
  float above = max(length(d) - uPlanet.z, 0.0);
  vec3 sky = mix(INK, NAVY, exp(-above * 2.5) * 0.85);

  // Stars, sparse and fixed, fading out into the glow.
  vec2 cell = floor(p * 110.0);
  vec2 jitter = vec2(hash13(vec3(cell, 3.0)), hash13(vec3(cell, 5.0))) - 0.5;
  float star = step(0.975, hash13(vec3(cell, 7.0)));
  star *= smoothstep(0.12, 0.0, length(fract(p * 110.0) - 0.5 - jitter * 0.6));
  sky += vec3(0.9, 0.92, 1.0) * star * (0.35 + 0.65 * hash13(vec3(cell, 9.0))) * (1.0 - exp(-above * 6.0));

  // Painted wisps of light that follow the limb, then the halo of the atmosphere itself.
  float angle = atan(dir.y, dir.x);
  float wisp = smoothstep(0.45, 0.85, fbm(vec3(angle * 9.0, above * 26.0, 3.0))) * exp(-above * 7.0);
  sky += glow * wisp * 0.35;
  sky += glow * exp(-above * 22.0) * (0.55 + 0.6 * warm);

  // The sun about to rise: a hot point on the limb with a soft bloom around it.
  vec2 sunPoint = uPlanet.xy + sunDir * uPlanet.z;
  float fd = length(p - sunPoint);
  vec3 flare = DAWN * exp(-fd * fd * 420.0) * 0.95 + CORAL * exp(-fd * 5.5) * 0.3;
  sky += flare;

  vec3 color = sky;
  if (r < 1.0 + aa) {
    vec2 xy = d / uPlanet.z;
    vec3 n = vec3(xy, sqrt(max(1.0 - dot(xy, xy), 0.0)));
    vec3 planet = surface(n);
    planet += glow * pow(1.0 - n.z, 4.0) * (0.15 + 0.35 * warm) + flare * 0.45;
    color = mix(sky, planet, 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r));
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Per frame: draws the baked backdrop, then the SmartxDreams symbol as cloud over the planet. */
export const composeFragmentShader = /* glsl */ `
uniform sampler2D uBase;
uniform sampler2D uSymbol;     // cloud-density mask: S strand in red, D strand in green (symbol-mask.ts)
uniform vec4 uSymbolPlace;     // centre x, centre y and mask side (hero heights from the bottom-left), tilt
uniform vec3 uPlanet;
uniform vec3 uSun;
uniform vec2 uResolution;
uniform float uTime;           // seconds the scene has been running

varying vec2 vUv;

${noise}
${palette}

// How far (hero heights) motion starts inside the limb, and where it reaches full strength. The limb, its
// glow and the sky never move; motion eases in within this band.
const float CALM_LIMB = 0.018;
const float FULL_MOTION = 0.065;

// Slow movement of the whole globe and its weather, in hero heights; zero at t = 0.
vec2 ambient(vec2 p) {
  // A shared orbital drift, small at every size, so the planet feels alive without moving the copy.
  vec2 orbital = vec2(12.0 * sin(uTime * 0.055), 4.5 * sin(uTime * 0.043));
  // Weather bands sliding across the oceans: broad, coherent flow that varies with latitude and longitude,
  // strongest in a few static patches of weather (not a ripple, and not tied to pixel brightness, which
  // would tear fine coast and cloud detail).
  vec2 bands = vec2(28.0 * (sin(uTime * 0.22 + p.y * 2.5) - sin(p.y * 2.5)),
                    12.0 * (sin(uTime * 0.18 + p.x * 2.5) - sin(p.x * 2.5)));
  float weather = smoothstep(0.35, 0.7, noise3(vec3(p * 2.2, 4.0)));
  return (orbital + bands * weather) / uResolution.y;
}

// The symbol lies on the curved surface and is seen at a slant, so it is drawn a little shorter than wide.
const float FORESHORTEN = 0.86;

vec2 symbolUv(vec2 p) {
  vec2 q = p - uSymbolPlace.xy;
  float c = cos(uSymbolPlace.w), s = sin(uSymbolPlace.w);
  q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
  q.y /= FORESHORTEN;
  return q / uSymbolPlace.z + 0.5;
}

// Cloud density of the symbol at p (hero heights): the soft strands, eroded and puffed out by noise in the
// symbol's own space so the billows stay put on the strands. Three scales: broad lumps that swell and thin
// the strands, rounded cumulus puffs along their edges, and fine wisps.
float density(vec2 p) {
  vec2 uv = symbolUv(p);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  vec2 strands = texture2D(uSymbol, uv).rg;
  float body = max(strands.r, strands.g);
  if (body < 0.02) return 0.0;
  float lumps = fbm(vec3(uv * 7.0, 1.7));
  float puffs = 1.0 - abs(noise3(vec3(uv * 22.0, 3.1)) * 2.0 - 1.0);
  float wisps = noise3(vec3(uv * 60.0, 8.2));
  return smoothstep(0.28, 0.75, body + (lumps - 0.5) * 0.7 + (puffs - 0.5) * 0.28 + (wisps - 0.5) * 0.12);
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vUv * vec2(aspect, 1.0);

  // Motion only inside the limb, and never far enough to pull sky or glow across it: the travel is capped
  // at half the distance to the calm band.
  float inside = uPlanet.z - length(p - uPlanet.xy);
  vec2 delta = vec2(0.0);
  if (inside > CALM_LIMB) {
    delta = ambient(p) * smoothstep(CALM_LIMB, FULL_MOTION, inside);
    float limit = (inside - CALM_LIMB) * 0.5;
    float travel = length(delta);
    if (travel > limit) delta *= limit / travel;
  }
  vec3 base = texture2D(uBase, (p + delta) / vec2(aspect, 1.0)).rgb;

  // Skip the symbol far from it: one cheap distance test for most of the screen.
  if (length(p - uSymbolPlace.xy) > uSymbolPlace.z * 0.85) {
    gl_FragColor = vec4(base, 1.0);
    return;
  }
  // The symbol rides the weather at its centre as one piece: shearing it with the bands would slowly bend
  // the S and the D out of shape.
  p += ambient(uSymbolPlace.xy);

  // Only on the planet, fading out just inside the limb.
  float r = length(p - uPlanet.xy) / uPlanet.z;
  float onPlanet = 1.0 - smoothstep(0.97, 1.0, r);

  vec2 sunDir = normalize(uSun.xy);
  float rho = density(p);
  // Self-shadow: cloud between this point and the sun dims it, so each strand is lit on its sunward side.
  float occlusion = density(p + sunDir * 0.005) * 0.5 + density(p + sunDir * 0.014) * 0.5;
  float sun = exp(-occlusion * 1.3);
  // Thick cores scatter more light, so they stay bright even on the shaded side.
  vec3 cloud = mix(CLOUD_SHADE, CLOUD_SUN, clamp(sun * 0.8 + rho * 0.35, 0.0, 1.0));
  cloud += DAWN * pow(sun, 3.0) * 0.12;
  // The cloud's shadow on the ocean: a point is shaded when cloud lies toward the sun from it.
  float shadow = density(p + sunDir * 0.03) * (1.0 - rho);
  vec3 ground = base * (1.0 - 0.4 * shadow * onPlanet);

  // Thin edges let the ocean through, as real cloud does.
  float alpha = smoothstep(0.02, 0.6, rho) * 0.97 * onPlanet;
  gl_FragColor = vec4(mix(ground, cloud, alpha), 1.0);
}
`;
