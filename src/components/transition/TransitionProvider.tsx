"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { cssEase } from "@/styles/motion";
import { routeLabel } from "./route-label";

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
  const content = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
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
      const word = label.current;
      const layer = content.current;
      if (word) word.textContent = routeLabel(url.pathname);

      // The label rises out of its mask while the panels are still closing.
      layer?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 220, fill: "forwards" });
      word?.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
        duration: 380,
        delay: 240,
        easing: cssEase("outQuint"),
        fill: "forwards",
      });
      await animatePanels("in");

      const routeChanged = new Promise<void>((resolve) => {
        routeWaiter.current = resolve;
        window.setTimeout(resolve, ROUTE_TIMEOUT_MS);
      });
      router.push(href);
      await routeChanged;
      // One frame for the new page to paint under the cover.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      // Label leaves upward and the layer fades, then the panels reveal the page.
      word?.animate([{ transform: "translateY(0)" }, { transform: "translateY(-110%)" }], {
        duration: 260,
        easing: cssEase("inOutCubic"),
        fill: "forwards",
      });
      await layer?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 60, fill: "forwards" }).finished;
      await animatePanels("out");
      for (const node of [...panels(), word, layer]) node?.getAnimations().forEach((a) => a.cancel());
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
        {/* Destination label over a soft brand glow, shown while the panels cover the page. */}
        <div ref={content} className="absolute inset-0 flex flex-col items-center justify-center gap-5 opacity-0">
          <div
            className="absolute top-1/2 left-1/2 size-[60vmin] -translate-1/2 rounded-full opacity-60 blur-[48px]"
            style={{ background: "radial-gradient(closest-side, rgb(109 74 255 / 0.85), rgb(255 107 61 / 0.35) 60%, transparent)" }}
          />
          <Logo variant="mark" height={36} decorative className="relative" />
          <div className="relative overflow-hidden px-1">
            <span
              ref={label}
              className="block translate-y-[110%] text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.1] tracking-[-0.02em] text-white"
            />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
