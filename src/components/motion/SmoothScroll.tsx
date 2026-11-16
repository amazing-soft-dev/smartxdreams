"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";

/**
 * Smooth scrolling with Lenis. Lenis eases the native scroll position over time (not per frame), so it
 * behaves the same on 60 Hz and 120 Hz screens and keeps native scrollbars, find-in-page and anchors.
 *
 * The instance lives in a tiny external store so any component can read it with useLenis()
 * (for example to stop scrolling while a menu is open) without re-rendering the whole tree.
 */

let instance: Lenis | null = null;
const listeners = new Set<() => void>();

function setInstance(next: Lenis | null) {
  instance = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The active Lenis instance, or null when smooth scrolling is off. */
export function useLenis(): Lenis | null {
  return useSyncExternalStore(
    subscribe,
    () => instance,
    () => null,
  );
}

/** Ease-out-expo: fast start, long gentle stop. */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

function createLenis() {
  return new Lenis({
    duration: 1.1,
    easing: easeOutExpo,
    autoRaf: true,
  });
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = createLenis();
    setInstance(lenis);
    return () => {
      lenis.destroy();
      setInstance(null);
    };
  }, []);

  return children;
}
