"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { cssEase } from "@/styles/motion";

/** Panel timing: 450 ms per panel, 40 ms stagger, so the cover is closed after 610 ms. */
const PANEL_MS = 450;
const STAGGER_MS = 40;
const PANELS = 5;
/** Longest we wait for the new route to render before revealing anyway. */
const ROUTE_TIMEOUT_MS = 1500;

type TransitionApi = {
  /** Navigate to an internal href behind the panel transition. */
  navigate: (href: string) => void;
};

const TransitionContext = createContext<TransitionApi | null>(null);

/** Navigation with the page transition. Outside the provider it falls back to plain navigation. */
export function useTransitionNav(): TransitionApi {
  const router = useRouter();
  const api = useContext(TransitionContext);
  return api ?? { navigate: (href: string) => router.push(href) };
}

/** Even panels enter from the top, odd ones from the bottom. */
const offscreen = (i: number, phase: "in" | "out") => {
  const fromTop = i % 2 === 0;
  // Covering: enter from your side. Revealing: keep travelling the same way and leave by the other side.
  const sign = phase === "in" ? (fromTop ? -1 : 1) : fromTop ? 1 : -1;
  return `translateY(${sign * 101}%)`;
};

/**
 * Page transition: five ink panels close in alternately from the top and the bottom, the route changes
 * underneath, and the panels carry on through to reveal the new page. Mounted once in the root layout.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  // Resolves when the pathname changes, so the reveal waits for the new page.
  const routeWaiter = useRef<(() => void) | null>(null);

  useEffect(() => {
    routeWaiter.current?.();
    routeWaiter.current = null;
  }, [pathname]);

  const panels = () => Array.from(overlay.current?.querySelectorAll<HTMLElement>("[data-panel]") ?? []);

  const animatePanels = useCallback((phase: "in" | "out") => {
    const ease = cssEase("panel");
    return Promise.all(
      panels().map((panel, i) =>
        panel.animate(
          phase === "in"
            ? [{ transform: offscreen(i, "in") }, { transform: "translateY(0)" }]
            : [{ transform: "translateY(0)" }, { transform: offscreen(i, "out") }],
          { duration: PANEL_MS, delay: i * STAGGER_MS, easing: ease, fill: "forwards" },
        ).finished,
      ),
    );
  }, []);

  const navigate = useCallback(
    async (href: string) => {
      const url = new URL(href, window.location.href);
      const el = overlay.current;
      if (busy.current || !el || url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      busy.current = true;
      router.prefetch(href);
      el.dataset.state = "active";

      await animatePanels("in");

      const routeChanged = new Promise<void>((resolve) => {
        routeWaiter.current = resolve;
        window.setTimeout(resolve, ROUTE_TIMEOUT_MS);
      });
      router.push(href);
      await routeChanged;
      // One frame for the new page to paint under the cover.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      await animatePanels("out");
      for (const panel of panels()) panel.getAnimations().forEach((a) => a.cancel());
      delete el.dataset.state;
      busy.current = false;
    },
    [animatePanels, router],
  );

  const api = useMemo(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div
        ref={overlay}
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-0 z-[100] flex data-[state=active]:pointer-events-auto data-[state=active]:visible"
      >
        {Array.from({ length: PANELS }, (_, i) => (
          <div
            key={i}
            data-panel
            className="-ml-px h-full flex-1 bg-ink will-change-transform"
            style={{ transform: offscreen(i, "in") }}
          />
        ))}
      </div>
    </TransitionContext.Provider>
  );
}
