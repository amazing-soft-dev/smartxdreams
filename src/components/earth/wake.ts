/**
 * The pointer wake over the Earth backdrop: as a fine pointer moves across the planet it leaves a short trail
 * of gusts, and each gust pushes the clouds near it along the pointer's direction, then lets them settle back.
 *
 * A gust is a position, a push (both in hero heights, origin bottom-left) and the time it was made. Its
 * strength eases in over WAKE_RISE and decays over WAKE_DECAY, so a push is gone within about two seconds
 * and the clouds return to where they were. The shader sums the gusts as Gaussian bumps of WAKE_RADIUS.
 */

/** Gusts alive at once. The oldest is replaced by the newest. */
export const WAKE_GUSTS = 6;
/** Reach of one gust (hero heights): the Gaussian's radius. */
export const WAKE_RADIUS = 0.07;
/** Distance the pointer must travel (hero heights) before it leaves a new gust. */
export const WAKE_SPACING = 0.012;
/** The push is the pointer's velocity times this many seconds... */
export const WAKE_PUSH_TIME = 0.06;
/** ...but never more than this (hero heights), however fast the pointer flicks. */
export const WAKE_MAX_PUSH = 0.03;
/** Ease-in and decay time constants, in seconds. */
export const WAKE_RISE = 0.08;
export const WAKE_DECAY = 0.55;

type Gust = { x: number; y: number; px: number; py: number; born: number };

/** Strength of a gust `age` seconds old: 0 before it is made, rising quickly to near 1, then fading. */
export function gustEnvelope(age: number): number {
  if (age < 0 || !Number.isFinite(age)) return 0;
  return (1 - Math.exp(-age / WAKE_RISE)) * Math.exp(-age / WAKE_DECAY);
}

export type Wake = {
  /** The pointer is at (x, y), hero heights from the bottom-left, at time t (seconds). */
  move: (x: number, y: number, t: number) => void;
  /** The pointer left the planet: the next move starts a fresh trail instead of jumping from here. */
  leave: () => void;
  /**
   * Writes every gust as x, y, push x, push y (the push already scaled by its envelope at time t) into
   * `out`, WAKE_GUSTS x 4 numbers. Returns true while any gust still moves the clouds noticeably.
   */
  write: (t: number, out: Float32Array) => boolean;
};

export function createWake(): Wake {
  const gusts: Gust[] = Array.from({ length: WAKE_GUSTS }, () => ({ x: 0, y: 0, px: 0, py: 0, born: -Infinity }));
  let next = 0;
  let last: { x: number; y: number; t: number } | null = null;

  return {
    move(x, y, t) {
      if (!last) {
        last = { x, y, t };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      const distance = Math.hypot(dx, dy);
      if (distance < WAKE_SPACING) return;
      // At least one 120 Hz frame, so a burst of events in one frame does not read as an infinite speed.
      const dt = Math.max(t - last.t, 1 / 120);
      let px = (dx / dt) * WAKE_PUSH_TIME;
      let py = (dy / dt) * WAKE_PUSH_TIME;
      const push = Math.hypot(px, py);
      if (push > WAKE_MAX_PUSH) {
        px *= WAKE_MAX_PUSH / push;
        py *= WAKE_MAX_PUSH / push;
      }
      gusts[next] = { x: (x + last.x) / 2, y: (y + last.y) / 2, px, py, born: t };
      next = (next + 1) % WAKE_GUSTS;
      last = { x, y, t };
    },
    leave() {
      last = null;
    },
    write(t, out) {
      let alive = false;
      gusts.forEach((g, i) => {
        const strength = gustEnvelope(t - g.born);
        out[i * 4] = g.x;
        out[i * 4 + 1] = g.y;
        out[i * 4 + 2] = g.px * strength;
        out[i * 4 + 3] = g.py * strength;
        if (Math.hypot(g.px, g.py) * strength > 1e-4) alive = true;
      });
      return alive;
    },
  };
}
