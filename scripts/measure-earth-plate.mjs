// Measures the limb of the Earth plate (public/brand/earth/earth-plate-1774.webp) and fits it with a cubic
// horizon in normalised plate coordinates. Run it when the art changes and copy the printed coefficients
// into HORIZON in src/components/earth/plate.ts. The landmarks there (sunrise, cyclone, cloud symbol) are
// measured by eye on the plate; re-check them too.
//
//   node scripts/measure-earth-plate.mjs [path/to/plate.webp]
//
// u runs 0..1 left to right, v runs 0..1 top to bottom.

import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const file = process.argv[2] ?? path.join(root, "public/brand/earth/earth-plate-1774.webp");
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const px = (x, y) => {
  const i = (y * W + x) * C;
  return [data[i], data[i + 1], data[i + 2]];
};

// Limb: in every 8th column, the first pixel from the top where the blue atmosphere starts. A pixel counts
// when it is clearly blue (blue above 90 and above red); requiring the next 6 pixels down to count too
// rules out the white stars in the black sky.
const limb = [];
for (let x = 0; x < W; x += 8) {
  for (let y = 0; y < H - 6; y++) {
    let lit = true;
    for (let k = 0; k < 6 && lit; k++) {
      const [r, , b] = px(x, y + k);
      lit = b > 90 && b > r * 1.05;
    }
    if (lit) {
      limb.push([x, y]);
      break;
    }
  }
}

// Least-squares cubic v(u) through the limb samples, with one pass rejecting points more than 6 px off
// (the sun's glare reads as an early limb).
function fitCubic(points) {
  const n = 4;
  const M = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (const [x, y] of points) {
    const u = x / W;
    const v = y / H;
    const p = Array.from({ length: 2 * n }, (_, k) => u ** k);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) M[i][j] += p[i + j];
      M[i][n] += v * p[i];
    }
  }
  for (let i = 0; i < n; i++) {
    let best = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[best][i])) best = r;
    [M[i], M[best]] = [M[best], M[i]];
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r][i] / M[i][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}
const at = (co, u) => co.reduce((s, c, k) => s + c * u ** k, 0);
// Reject outliers in rounds (20, 10, then 6 px): the sun's glare and a few bright clouds read as an early
// limb, and one tight round straight away can lock onto the wrong part of the curve.
let kept = limb;
let coeffs = fitCubic(kept);
for (const tolerance of [20, 10, 6]) {
  kept = limb.filter(([x, y]) => Math.abs(at(coeffs, x / W) * H - y) <= tolerance);
  coeffs = fitCubic(kept);
}
const errors = kept.map(([x, y]) => Math.abs(at(coeffs, x / W) * H - y));

const r5 = (n) => Number(n.toFixed(5));
console.log(
  JSON.stringify(
    {
      plate: { width: W, height: H },
      horizon: coeffs.map(r5),
      horizonFit: {
        samples: kept.length,
        rejected: limb.length - kept.length,
        coveredPx: [kept[0][0], kept.at(-1)[0]],
        maxErrorPx: r5(Math.max(...errors)),
      },
    },
    null,
    2,
  ),
);
