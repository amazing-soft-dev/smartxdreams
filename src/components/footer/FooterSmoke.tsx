"use client";

import dynamic from "next/dynamic";

/**
 * The footer smoke, loaded on the client only after hydration, in its own chunk. It never blocks the first
 * paint, and pages that never reach the footer still download it only once the browser is idle.
 */
export const FooterSmoke = dynamic(() => import("@/components/webgl/SmokeBackground").then((m) => m.SmokeBackground), {
  ssr: false,
});
