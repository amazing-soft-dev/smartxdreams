"use client";

import { LazyScene } from "@/components/webgl/LazyScene";
import { EarthFallback } from "./EarthFallback";

const loadScene = () => import("./EarthScene");

/**
 * The Earth seen from orbit, behind the Home hero. The CSS planet paints first; the three.js scene loads on
 * top when useSceneSupport allows it (not for reduced motion, data saver, low-power devices or missing WebGL
 * 2), once the hero is near the viewport and the browser is idle.
 * Place it inside a positioned, dark container; it is decorative and never takes pointer events.
 */
export function EarthField({ className }: { className?: string }) {
  return <LazyScene load={loadScene} sceneProps={{}} fallback={<EarthFallback />} className={className} />;
}
