/**
 * An eased pointer for decorative scenes. Pointer events set a target (a position in the scene's box,
 * 0 to 1 with y up, and a strength: 1 while the pointer is over it, 0 once it leaves) and every frame eases
 * the current value toward it, so the scene follows the cursor smoothly and settles back when it leaves.
 */

export type PointerState = { x: number; y: number; strength: number };

/** Time constant of the easing in ms: about 63% of the way to the target in this long. */
export const POINTER_EASE_MS = 250;
/** Below this strength the pointer counts as gone. */
const REST = 0.001;

export function createPointerTracker(easeMs = POINTER_EASE_MS) {
  const target: PointerState = { x: 0.5, y: 0.5, strength: 0 };
  const current: PointerState = { x: 0.5, y: 0.5, strength: 0 };
  return {
    /** The pointer is at (x, y) in the box, 0 to 1 with y up. */
    move(x: number, y: number) {
      target.x = x;
      target.y = y;
      target.strength = 1;
      // Arriving from nowhere: start where the pointer is, so the scene doesn't sweep in from the centre.
      if (current.strength < REST) {
        current.x = x;
        current.y = y;
      }
    },
    /** The pointer left the box: fade the effect out where it was. */
    leave() {
      target.strength = 0;
    },
    /** Advances the easing by `dt` ms and returns the current state (the same object each call). */
    step(dt: number): Readonly<PointerState> {
      const k = 1 - Math.exp(-Math.max(0, dt) / easeMs);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      current.strength += (target.strength - current.strength) * k;
      if (target.strength === 0 && current.strength < REST) current.strength = 0;
      return current;
    },
    /** True once the effect has fully faded out and nothing is moving. */
    get resting() {
      return target.strength === 0 && current.strength === 0;
    },
  };
}

/**
 * Whether a scene should follow the pointer: only with a real hovering pointer (a mouse or trackpad, not
 * touch, where there is no cursor to follow) and never for reduced motion.
 */
export function pointerFollowAllowed(matchMedia: (query: string) => { matches: boolean }): boolean {
  return matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
