/**
 * Six small constellations, one per product, laid out across the star-field. Each is a handful of points
 * (x, y in scene units, z slightly in front of the background stars) and the pairs of points joined by
 * lines. Shapes loosely echo the product: a path for JobAtlas, a form for ApplyPilot, a roof for SiteLog,
 * a tooth for ToothLedger, a house for Kinly and a shield for TrustDraft.
 */
export type Constellation = {
  slug: string;
  points: Array<[number, number]>;
  /** Index pairs into points. */
  lines: Array<[number, number]>;
};

/** Depth of the constellation layer: in front of most stars, so the lines read clearly. */
export const CONSTELLATION_Z = -1.2;

export const constellations: Constellation[] = [
  {
    slug: "jobatlas",
    points: [[-6.2, 2.6], [-5.4, 3.3], [-4.5, 2.9], [-3.8, 3.6], [-3.1, 3.1]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    slug: "applypilot",
    points: [[3.4, 3.4], [5.2, 3.4], [5.2, 2.1], [3.4, 2.1], [3.8, 2.9], [4.8, 2.9]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5]],
  },
  {
    slug: "sitelog",
    points: [[-6.6, -1.6], [-5.6, -0.6], [-4.6, -1.6], [-4.6, -2.8], [-6.6, -2.8]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    slug: "toothledger",
    points: [[5.0, -0.8], [6.2, -0.8], [6.4, -1.8], [5.9, -2.9], [5.6, -2.1], [5.3, -2.9], [4.8, -1.8]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]],
  },
  {
    slug: "kinly",
    points: [[-1.6, -3.2], [-0.6, -2.4], [0.4, -3.2], [0.4, -4.1], [-1.6, -4.1]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    slug: "trustdraft",
    points: [[2.0, -2.6], [3.1, -2.2], [4.2, -2.6], [4.0, -3.6], [3.1, -4.3], [2.2, -3.6]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
  },
];
