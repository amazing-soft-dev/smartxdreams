/**
 * Motion tokens for JavaScript animation (Motion and the Web Animations API).
 * The CSS equivalents of the easings are the --ease-* variables in src/app/globals.css.
 */

/** Cubic-bezier control points, usable by Motion (`ease`) and as CSS strings via `cssEase`. */
export const ease = {
  /** Page-transition panels, rolling button labels. */
  panel: [0.76, 0, 0.24, 1],
  /** Entrances, menus, card lifts, label rises. */
  outQuint: [0.22, 1, 0.36, 1],
  /** Header hide, transition label exit. */
  inOutCubic: [0.65, 0, 0.35, 1],
  /** Header re-show. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Button release, checklist pop (overshoots). */
  back: [0.34, 1.56, 0.64, 1],
  /** Shine sweeps, link colour. */
  standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EaseName = keyof typeof ease;

export const cssEase = (name: EaseName): string => `cubic-bezier(${ease[name].join(", ")})`;

/** Springs for Motion `transition`. */
export const spring = {
  /** Text and button reveals. */
  a: { type: "spring", bounce: 0.2, duration: 0.6 },
  /** Hero mockup cards. */
  b: { type: "spring", bounce: 0.3, duration: 1.1 },
  /**
   * Beemas' rise (docs/motion-audit.md): every heading line and block fade-up, whatever its distance. An
   * overdamped spring, no overshoot, settled to 1% in about 1.5 s.
   */
  rise: { type: "spring", stiffness: 90, damping: 33, mass: 1 },
  // Its CSS twin is --ease-rise in globals.css (the same curve sampled as linear()).
  /** Beemas' side slides from 200 px: critically damped, quicker than the rise (settled in about 0.8 s). */
  slide: { type: "spring", stiffness: 64, damping: 16, mass: 1 },
  /** Beemas' header appear: long and soft, with a little give at the end. */
  appear: { type: "spring", duration: 2.7, bounce: 0.2 },
} as const;

/** Staggers and first delays measured on Beemas, in seconds (docs/motion-audit.md). */
export const stagger = {
  /** Between the lines of a heading or paragraph that rises line by line. */
  line: 0.16,
  /** Before the first line starts, once the text is in view. */
  lineDelay: 0.27,
  /** Between sibling cards in a group. */
  group: 0.2,
  /** Before the first card of a group starts. */
  groupDelay: 0.4,
} as const;

/** Durations in milliseconds, for timelines that are not springs. */
export const duration = {
  press: 140,
  fast: 250,
  base: 450,
  roll: 520,
  slow: 900,
  sweep: 1100,
} as const;
