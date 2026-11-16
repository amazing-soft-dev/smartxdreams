"use client";

import { type RefObject, useEffect } from "react";
import { type Camera, type Scene, WebGLRenderer } from "three";
import { isTopScene, setSceneVisible } from "./scene-budget";
import { mountSceneCanvas } from "./scene-canvas";

/** Highest device pixel ratio we render at; above this the extra pixels are not worth the GPU time. */
export const MAX_SCENE_DPR = 1.75;

export type SceneHandle = {
  scene: Scene;
  camera: Camera;
  /** Called every frame with elapsed running time in seconds and the frame delta. */
  update?: (elapsed: number, delta: number) => void;
  /** Called when the canvas size changes, with CSS pixel width and height. */
  resize?: (width: number, height: number) => void;
  /** Free geometries, materials and textures created by setup. */
  dispose?: () => void;
};

/**
 * Owns a three.js WebGLRenderer for its whole life: creates a canvas inside `hostRef` and the renderer on it,
 * keeps it sized to the canvas box (pixel ratio capped at 1.75), runs the render loop only while the canvas
 * is on screen and the tab is visible, and on unmount disposes everything, releases the WebGL context and
 * removes the canvas. The canvas is new on every mount (see scene-canvas.ts), so a remount never picks up
 * the context the previous mount released.
 *
 * Only scene modules import this file, so three.js stays out of the main bundle.
 */
export function useThreeRenderer(
  /** Element the canvas is created in; the scene component positions and sizes it. */
  hostRef: RefObject<HTMLElement | null>,
  setup: () => SceneHandle,
  /** Identity and priority in the shared scene budget (see scene-budget.ts). */
  budget: { id: string; priority: number },
) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const { canvas, remove: removeCanvas } = mountSceneCanvas(host);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      removeCanvas();
      return; // No WebGL after all: the fallback underneath stays visible.
    }
    renderer.setClearColor(0x000000, 0);
    const handle = setup();

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_SCENE_DPR));
      renderer.setSize(width, height, false);
      handle.resize?.(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let onScreen = false;
    const tick = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      elapsed += delta;
      // Another visible scene outranks this one: keep the last frame and skip the GPU work.
      if (isTopScene(budget.id)) {
        handle.update?.(elapsed, delta);
        renderer.render(handle.scene, handle.camera);
      }
      frame = requestAnimationFrame(tick);
    };
    const play = () => {
      if (frame || !onScreen || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      setSceneVisible(budget.id, budget.priority, onScreen);
      if (onScreen) play();
      else pause();
    });
    intersection.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      pause();
      setSceneVisible(budget.id, budget.priority, false);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      handle.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      removeCanvas();
    };
    // setup is a plain function from the scene module; the renderer is created once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef]);
}
