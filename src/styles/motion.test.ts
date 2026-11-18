import { spring as springGenerator } from "motion";
import { describe, expect, it } from "vitest";
import { revealPresets } from "@/components/motion/Reveal";
import { spring } from "./motion";

/** A spring token run as Motion runs it, from `from` to 0, read at `t` ms. */
const at = (token: { stiffness: number; damping: number; mass: number }, from: number, t: number) =>
  springGenerator({ keyframes: [from, 0], stiffness: token.stiffness, damping: token.damping, mass: token.mass }).next(t).value;

describe("motion tokens match the Beemas samples (docs/motion-audit.md)", () => {
  it("spring.rise follows a 50 px fade-up to within 1 px", () => {
    const sampled: [number, number][] = [[193, 31.6], [392, 17.1], [594, 9.1], [792, 4.9], [990, 2.7]];
    for (const [t, y] of sampled) expect(Math.abs(at(spring.rise, 50, t) - y), `${t} ms`).toBeLessThan(1);
  });

  it("spring.slide follows a 200 px side slide to within 3 px", () => {
    const sampled: [number, number][] = [[216, -94], [430, -29], [620, -9], [820, -2]];
    for (const [t, x] of sampled) expect(Math.abs(at(spring.slide, -200, t) - x), `${t} ms`).toBeLessThan(3);
  });

  it("the Beemas presets start where Beemas does and use the measured springs", () => {
    expect(revealPresets.up150.hidden).toEqual({ opacity: 0, y: 150 });
    expect(revealPresets.left200.hidden).toEqual({ opacity: 0, x: -200 });
    expect(revealPresets.up75.transition).toBe(spring.rise);
    expect(revealPresets.right200.transition).toBe(spring.slide);
  });
});
