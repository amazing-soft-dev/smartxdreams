"use client";

import dynamic from "next/dynamic";

/**
 * The footer smoke, loaded on the client only, after hydration, in its own chunk, so it never blocks the
 * first paint. While the footer is off-screen the scene is paused (see SmokeBackground).
 */
export const FooterSmoke = dynamic(() => import("@/components/webgl/SmokeBackground").then((m) => m.SmokeBackground), {
  ssr: false,
});
