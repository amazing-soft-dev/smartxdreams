"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/** The WebGL smoke scene, in its own chunk, client only. */
const SmokeBackground = dynamic(() => import("@/components/webgl/SmokeBackground").then((m) => m.SmokeBackground), {
  ssr: false,
});

/**
 * The footer smoke. Its chunk is requested only when the footer comes within 600 px of the viewport, so a
 * visitor who never scrolls that far never downloads it, and it never competes with the page's first paint.
 * Once loaded, the scene pauses while the footer is off-screen (see SmokeBackground).
 */
export function FooterSmoke() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  return near ? <SmokeBackground /> : <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
