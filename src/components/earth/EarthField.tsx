"use client";

import { LazyScene } from "@/components/webgl/LazyScene";
import { EarthFallback } from "./EarthFallback";

const loadScene = () => import("./EarthScene");

/**
 * The Earth seen from orbit, behind the Home hero. The fallback paints first: the starfield sky and the
 * painted plate, still. The three.js scene loads on top when useSceneSupport allows it (not for reduced
 * motion, data saver, low-power devices or missing WebGL 2), once the hero is near the viewport and the
 * browser is idle, and brings the plate to life; outside the planet it is transparent over the same sky.
 * Place it inside a positioned container; it is decorative, and only the scene listens to the pointer.
 */
export function EarthField({ className }: { className?: string }) {
  return <LazyScene load={loadScene} sceneProps={{}} fallback={<EarthFallback />} className={className} />;
}
