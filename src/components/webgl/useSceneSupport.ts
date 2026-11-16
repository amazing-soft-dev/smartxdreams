"use client";

import { useEffect, useState } from "react";

export type SceneSupport =
  /** Not decided yet (server render and first client render). */
  | { status: "pending" }
  /** Safe to load and run a WebGL scene. */
  | { status: "ok" }
  /** Use the static fallback, and why. */
  | { status: "fallback"; reason: "reduced-motion" | "save-data" | "low-power" | "no-webgl" };

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Free the probe context straight away; browsers cap the number of live contexts.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/** Decides whether a decorative WebGL scene should run on this device. */
export function detectSceneSupport(): SceneSupport {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { status: "fallback", reason: "reduced-motion" };
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return { status: "fallback", reason: "save-data" };
  // Two or fewer cores, or 2 GB of memory or less: keep the battery and the main thread free.
  if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) return { status: "fallback", reason: "low-power" };
  if (!hasWebGL()) return { status: "fallback", reason: "no-webgl" };
  return { status: "ok" };
}

/**
 * Capability check for decorative WebGL. Starts as "pending" so server and client render the same
 * fallback markup, then settles after mount; re-checks if the reduced-motion preference changes.
 */
export function useSceneSupport(): SceneSupport {
  const [support, setSupport] = useState<SceneSupport>({ status: "pending" });
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSupport(detectSceneSupport());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return support;
}
