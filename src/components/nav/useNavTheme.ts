"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavTheme = "light" | "dark";

/** Vertical centre of the header bar, in px from the top of the viewport. */
const BAND = 50;

/**
 * Which kind of section is behind the header. Sections declare data-nav-theme="light|dark" (Section
 * does this from its surface). One IntersectionObserver watches a 1 px band at the header's centre,
 * so there is no polling and no layout reading on scroll (the Ignivo header polled every 800 ms).
 */
export function useNavTheme(initial: NavTheme = "dark"): NavTheme {
  const [theme, setTheme] = useState<NavTheme>(initial);
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      const bottom = Math.max(0, window.innerHeight - BAND - 1);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const value = (entry.target as HTMLElement).dataset.navTheme;
            if (value === "light" || value === "dark") setTheme(value);
          }
        },
        { rootMargin: `-${BAND}px 0px -${bottom}px 0px`, threshold: 0 },
      );
      document.querySelectorAll<HTMLElement>("[data-nav-theme]").forEach((el) => observer?.observe(el));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
    // Re-observe after client-side navigation, when the page's sections change.
  }, [pathname]);

  return theme;
}
