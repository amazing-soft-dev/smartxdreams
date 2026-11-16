"use client";

import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { useSceneSupport } from "./useSceneSupport";

type LazySceneProps<P extends object> = {
  /** Dynamic import of the scene module, e.g. () => import("./AstraScene"). */
  load: () => Promise<{ default: ComponentType<P> }>;
  /** Props passed to the scene once it has loaded. */
  sceneProps: P;
  /** Painted until (and unless) the scene loads. Server-rendered, so it is part of the first paint. */
  fallback: ReactNode;
  className?: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Loads a heavy client-only scene (three.js) only when it can help: the device passes useSceneSupport,
 * the container is near the viewport, and the browser is idle. Until then, and on devices that should not
 * run it, the static fallback stays. The scene module, and three.js with it, is a separate chunk that is
 * never part of the initial JavaScript.
 */
export function LazyScene<P extends object>({ load, sceneProps, fallback, className }: LazySceneProps<P>) {
  const box = useRef<HTMLDivElement>(null);
  const support = useSceneSupport();
  const [Scene, setScene] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    if (support.status !== "ok" || Scene) return;
    const el = box.current;
    if (!el) return;
    const win = window as IdleWindow;
    let idleId: number | undefined;
    let cancelled = false;

    const start = () => {
      const run = () => {
        load()
          .then((mod) => {
            // Function form: store the component itself, not call it.
            if (!cancelled) setScene(() => mod.default);
          })
          .catch(() => {
            // Leave the fallback in place if the chunk fails to load.
          });
      };
      if (win.requestIdleCallback) idleId = win.requestIdleCallback(run, { timeout: 2000 });
      else idleId = window.setTimeout(run, 300);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (idleId !== undefined) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [support.status, Scene, load]);

  const showScene = support.status === "ok" && Scene !== null;
  return (
    <div ref={box} aria-hidden="true" className={cx("pointer-events-none absolute inset-0 -z-10", className)}>
      {fallback}
      {showScene ? <Scene {...sceneProps} /> : null}
    </div>
  );
}
