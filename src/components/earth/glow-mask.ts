/**
 * The CSS fallback's glow, masked on the CPU exactly as the scene's shader masks it on the GPU.
 */

import { GLOW_BAND, glowCoverage, glowFade, horizonSlope, horizonV, PLATE_ASPECT } from "./plate";

/**
 * Keeps, in RGBA `pixels` (`width` × `height`, covering the whole plate), only the atmosphere glow outside the
 * limb, exactly as the scene's shader does: each pixel's alpha becomes glowCoverage() of its colour times
 * glowFade() of its distance from the limb, and the sky past the band becomes transparent. The colour is left
 * as painted, so the canvas shows it at that alpha, as the shader's premultiplied output does.
 *
 * The planet itself stays opaque. The planet canvas over it covers it anyway, but its clip path is
 * anti-aliased: with the sky under its edge, the limb would show a thin dark seam.
 */
export function maskGlow(pixels: Uint8ClampedArray, width: number, height: number): void {
  for (let x = 0; x < width; x++) {
    const u = (x + 0.5) / width;
    // horizonDistance(u, v), with the parts that depend only on the column worked out once.
    const limb = horizonV(u);
    const across = Math.hypot(1, horizonSlope(u) / PLATE_ASPECT);
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      const distance = ((y + 0.5) / height - limb) / across;
      if (distance >= 0) {
        pixels[i + 3] = 255;
        continue;
      }
      if (distance <= -GLOW_BAND) {
        pixels[i + 3] = 0;
        continue;
      }
      const alpha = glowCoverage(pixels[i]! / 255, pixels[i + 1]! / 255) * glowFade(distance);
      pixels[i + 3] = Math.round(alpha * 255);
    }
  }
}
