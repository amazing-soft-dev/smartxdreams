"use client";

import { useEffect } from "react";
import { restoreMotionPaused, setMotionPaused, useMotionPaused } from "@/components/motion/motion-pause";

type PauseMotionToggleProps = {
  /** The button's text while motion plays (`pause`) and while it is paused (`play`). */
  labels: { pause: string; play: string };
  className?: string;
};

/**
 * The footer's "Pause animations" button (WCAG 2.2.2 Pause, Stop, Hide): it holds everything that moves on
 * its own (the ticker, the typed and cycling headlines, the stars, the planet and the aurora) until it is
 * pressed again, on every page and on later visits. See motion-pause.ts for how the loops read it.
 *
 * It renders as "Pause animations" on the server and in the first client render; the remembered choice is
 * applied in an effect, after hydration, so the markup never depends on it.
 *
 * The label names what a press will do and changes with the state, so the button carries no aria-pressed:
 * with both, a screen reader would say "Play animations, pressed", which reads as if they were playing.
 */
export function PauseMotionToggle({ labels, className }: PauseMotionToggleProps) {
  const paused = useMotionPaused();
  useEffect(() => restoreMotionPaused(), []);
  return (
    <button type="button" onClick={() => setMotionPaused(!paused)} className={className}>
      {paused ? labels.play : labels.pause}
    </button>
  );
}
