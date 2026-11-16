"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
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
    // In-page links (#section) scroll smoothly through Lenis instead of jumping.
    anchors: true,
  });
}

/** Smooth scrolling is off for touch screens (native momentum is better) and for reduced motion. */
const DISABLE_QUERY = "(prefers-reduced-motion: reduce), (pointer: coarse)";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia(DISABLE_QUERY);
    let lenis: Lenis | null = null;

    const apply = () => {
      if (query.matches && lenis) {
        lenis.destroy();
        lenis = null;
        setInstance(null);
      } else if (!query.matches && !lenis) {
        lenis = createLenis();
        setInstance(lenis);
      }
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      lenis?.destroy();
      setInstance(null);
    };
  }, []);

  // On client-side navigation Next.js resets the scroll position; Lenis must jump with it instead of
  // easing from the old position. Hash links keep their own target.
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    instance?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return children;
}
