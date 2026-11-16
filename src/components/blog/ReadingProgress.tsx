"use client";

import { useEffect, useRef } from "react";

/**
 * A 3 px violet bar across the top of the window that fills as you read the post body: empty when the
 * body reaches the top of the window, full at its end. Decorative (aria-hidden): the scrollbar already
 * tells assistive tech where you are.
 *
 * It follows the scroll position directly, at most once per frame, with no transition or easing, so it
 * adds no motion of its own for people who prefer reduced motion. It sits above the header (z-50) and
 * below the page transition (z-100).
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    const bar = barRef.current;
    if (!target || !bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance <= 0 ? (rect.top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / distance));
      bar.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-violet-500" />
    </div>
  );
}
