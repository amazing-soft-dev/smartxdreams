"use client";

import { LazyScene } from "@/components/webgl/LazyScene";
import { StarFallback } from "@/components/webgl/StarFallback";

const loadScene = () => import("./AstraScene");

/**
 * The homepage star-field. Always paints the static CSS stars first; the three.js scene loads on top only
 * when useSceneSupport allows it (not for reduced motion, data saver, low-power devices or missing WebGL),
 * once the hero is near the viewport and the browser is idle. If the reduced-motion preference is switched
 * on while the page is open, the scene unmounts and the static stars remain.
 * Place it inside a positioned, dark container; it is decorative and never takes pointer events.
 */
export function AstraField({ className }: { className?: string }) {
  return <LazyScene load={loadScene} sceneProps={{}} fallback={<StarFallback />} className={className} />;
}
