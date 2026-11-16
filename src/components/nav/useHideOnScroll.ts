"use client";

import { useEffect, useState } from "react";

const SHOW_ABOVE = 80;
const THRESHOLD = 8;

/**
 * True while the header should be tucked away: after scrolling down more than 8 px in a row once past
 * the first 80 px. Scrolling up 8 px brings it back. Works with Lenis, which drives the native scroll
 * position, and reads the position at most once per frame.
 */
export function useHideOnScroll(disabled = false): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) return;
    let lastY = window.scrollY;
    let run = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;
      if (y < SHOW_ABOVE) {
        run = 0;
        setHidden(false);
        return;
      }
      if (delta === 0) return;
      run = Math.sign(delta) === Math.sign(run) ? run + delta : delta;
      if (run > THRESHOLD) setHidden(true);
      else if (run < -THRESHOLD) setHidden(false);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [disabled]);

  // While disabled the header always shows; the stored value resumes once enabled again.
  return hidden && !disabled;
}
