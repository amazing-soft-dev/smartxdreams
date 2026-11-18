"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { cssEase } from "@/styles/motion";
import { routeLabel } from "./route-label";

/**
 * Panel timing, measured frame by frame on the reference transition (docs/motion-audit.md#page-transition):
 * the cover takes 500 ms per panel with a 55 ms stagger, so it is closed after 720 ms; the reveal is a
 * touch quicker, 450 ms per panel with a 45 ms stagger. Both on the panel ease, a slow start and long settle.
 */
const PANEL_MS = { in: 500, out: 450 } as const;
const STAGGER_MS = { in: 55, out: 45 } as const;
const PANELS = 5;
/** The lockup and the destination fade in together, readable while the last panels are still closing. */
const CONTENT_DELAY_MS = 340;
const CONTENT_IN_MS = 240;
/**
 * Least time the closed cover stays up with the destination on it, however fast the route renders: on the
 * reference the name is readable for about 700 ms before it leaves.
 */
const MIN_HOLD_MS = 700;
/** The exit: the name leaves upward; FADE_DELAY_MS in, the lockup and the glow fade; then the panels go. */
const LABEL_OUT_MS = 260;
const FADE_DELAY_MS = 120;
const FADE_OUT_MS = 380;
/** Longest we wait for the new route to render before revealing anyway. */
const ROUTE_TIMEOUT_MS = 1500;
/** Extra time before a stalled panel animation is forced to finish. */
const SAFETY_MARGIN_MS = 600;

/**
 * While the panels cover the page, <html> carries data-page-covered. When they start to leave, the provider
 * removes it and fires PAGE_REVEALED on window, so the new page can start its entrance (its title rising)
 * when it can be seen instead of behind the cover.
 */
export const PAGE_REVEALED = "sxd:page-revealed";

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

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

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
  const mark = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const announcer = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  // Resolves when the pathname changes, so the reveal waits for the new page.
  const routeWaiter = useRef<(() => void) | null>(null);

  // The overlay is invisible until the first navigation, and an image is only decoded when it is first
  // painted, so the mark could pop in a frame late. Decode it while the browser is idle instead.
  useEffect(() => {
    const img = mark.current?.querySelector("img");
    if (!img) return;
    const decode = () => img.decode().catch(() => undefined);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(decode, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(decode, 1000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    routeWaiter.current?.();
    routeWaiter.current = null;
  }, [pathname]);

  // Back and forward buttons skip the panels (the visitor already knows where they are going) and use a
  // short View Transitions cross-fade instead, where the browser supports it. The old page is captured when
  // popstate fires; the new one once Next.js has rendered the new path.
  useEffect(() => {
    type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
    const doc = document as Document & {
      startViewTransition?: (update: () => Promise<void>) => ViewTransitionLike;
    };
    // A view transition rejects its promises when the browser skips it (for example when the page is
    // already showing the new state, or the tab is hidden). That is harmless; mark them handled so it does
    // not surface as an unhandled rejection.
    const quiet = (vt: ViewTransitionLike | undefined | null) => {
      for (const p of [vt?.ready, vt?.finished, vt?.updateCallbackDone]) p?.catch(() => undefined);
    };
    // Cross-document navigations (@view-transition in globals.css) hand their transition to pagereveal.
    const onPageReveal = (event: Event) => quiet((event as Event & { viewTransition?: ViewTransitionLike }).viewTransition);
    window.addEventListener("pagereveal", onPageReveal);

    const onPopState = () => {
      if (typeof doc.startViewTransition !== "function") return;
      if (busy.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      quiet(
        doc.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              routeWaiter.current = resolve;
              window.setTimeout(resolve, 600);
            }),
        ),
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagereveal", onPageReveal);
    };
  }, []);

  const panels = () => Array.from(overlay.current?.querySelectorAll<HTMLElement>("[data-panel]") ?? []);

  const animatePanels = useCallback((phase: "in" | "out") => {
    const ease = cssEase("panel");
    const animations = panels().map((panel, i) =>
      panel.animate(
        phase === "in"
          ? [{ transform: offscreen(i, "in") }, { transform: "translateY(0)" }]
          : [{ transform: "translateY(0)" }, { transform: offscreen(i, "out") }],
        { duration: PANEL_MS[phase], delay: i * STAGGER_MS[phase], easing: ease, fill: "forwards" },
      ),
    );
    // Safety net: if the browser stops advancing animations (a hidden or throttled tab), jump them to
    // their end instead of leaving the overlay blocking the page.
    const safety = window.setTimeout(
      () => animations.forEach((a) => a.finish()),
      PANEL_MS[phase] + STAGGER_MS[phase] * PANELS + SAFETY_MARGIN_MS,
    );
    return Promise.all(animations.map((a) => a.finished.catch(() => undefined))).finally(() =>
      window.clearTimeout(safety),
    );
  }, []);

  /**
   * After a client-side navigation, move keyboard and screen-reader focus to the new page's h1 (instead of
   * leaving it on a link that no longer exists) and announce the page through a polite live region.
   */
  const arrive = (pathname: string) => {
    const heading = document.querySelector<HTMLElement>("main h1, h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    if (announcer.current) announcer.current.textContent = `${routeLabel(pathname)} page`;
  };

  const navigate = useCallback(
    async (href: string) => {
      const url = new URL(href, window.location.href);
      const el = overlay.current;
      if (busy.current || !el || url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      // Reduced motion: no overlay at all, but keep the focus move and the announcement.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const changed = new Promise<void>((resolve) => {
          routeWaiter.current = resolve;
          window.setTimeout(resolve, ROUTE_TIMEOUT_MS);
        });
        router.push(href);
        await changed;
        arrive(url.pathname);
        return;
      }
      busy.current = true;
      router.prefetch(href);
      el.dataset.state = "active";
      document.documentElement.dataset.pageCovered = "";
      const word = label.current;
      const layer = content.current;
      if (word) word.textContent = routeLabel(url.pathname);
      const logo = mark.current;
      const halo = glow.current;

      // The lockup and the destination fade in together, in place, while the last panels are still closing.
      layer?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: CONTENT_IN_MS,
        delay: CONTENT_DELAY_MS,
        easing: cssEase("outQuint"),
        fill: "forwards",
      });
      await animatePanels("in");
      const closedAt = performance.now();

      const routeChanged = new Promise<void>((resolve) => {
        routeWaiter.current = resolve;
        window.setTimeout(resolve, ROUTE_TIMEOUT_MS);
      });
      router.push(href);
      await routeChanged;
      // Hold the cover until the destination has been readable for MIN_HOLD_MS, and in any case a moment
      // for the new page to paint underneath. Timers, not requestAnimationFrame, which never fires in a
      // hidden tab.
      await wait(Math.max(32, MIN_HOLD_MS - (performance.now() - closedAt)));

      // The exit runs in sequence, as on the reference: the name slides up out of its mask; 120 ms in, the
      // lockup and the glow start to fade; only once they are gone do the panels carry on through.
      word?.animate([{ transform: "translateY(0)" }, { transform: "translateY(-110%)" }], {
        duration: LABEL_OUT_MS,
        easing: cssEase("inOutCubic"),
        fill: "forwards",
      });
      await wait(FADE_DELAY_MS);
      logo?.animate([{ opacity: 0, transform: "scale(0.96)" }], { duration: FADE_OUT_MS, easing: cssEase("standard"), fill: "forwards" });
      halo?.animate([{ opacity: 0 }], { duration: FADE_OUT_MS, easing: cssEase("standard"), fill: "forwards" });
      await wait(FADE_OUT_MS);
      // The panels are about to leave: let the new page begin its entrance as it comes into sight.
      delete document.documentElement.dataset.pageCovered;
      window.dispatchEvent(new Event(PAGE_REVEALED));
      await animatePanels("out");
      for (const node of [...panels(), word, layer, logo, halo]) node?.getAnimations().forEach((a) => a.cancel());
      delete el.dataset.state;
      busy.current = false;
      arrive(url.pathname);
    },
    [animatePanels, router],
  );

  const api = useMemo(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div ref={announcer} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
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
        {/*
          The brand lockup and the destination over one soft glow, shown while the panels cover the page. Where
          the reference glows in its own ember orange, the glow is the brand's: violet-500 at the heart, warming
          to coral-500 at the rim, kept dim so the white type reads on it.
        */}
        <div ref={content} className="absolute inset-0 flex flex-col items-center justify-center gap-5 opacity-0">
          <div
            ref={glow}
            className="absolute top-1/2 left-1/2 size-[70vmin] -translate-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgb(109 74 255 / 0.42), rgb(109 74 255 / 0.24) 32%, rgb(182 90 158 / 0.13) 58%, rgb(255 107 61 / 0.05) 80%, rgb(255 107 61 / 0))",
            }}
          />
          <span ref={mark} className="relative block">
            <Logo variant="full" tone="light" height={28} decorative fetchPriority="low" />
          </span>
          <div className="relative overflow-hidden px-1">
            <span
              ref={label}
              className="block text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.1] tracking-[-0.02em] text-white"
            />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
