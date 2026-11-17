"use client";

import { useEffect } from "react";
import { setActiveProduct } from "./active-product";

const productOf = (target: EventTarget | null) =>
  target instanceof Element ? (target.closest<HTMLElement>("[data-product]")?.dataset.product ?? null) : null;

/**
 * Sets the active product while the pointer is over, or keyboard focus is inside, any element with
 * data-product="<slug>", and clears it on leave. One set of document listeners for the whole page.
 */
export function useProductHighlight() {
  useEffect(() => {
    const onEnter = (event: Event) => {
      const slug = productOf(event.target);
      if (slug) setActiveProduct(slug);
    };
    const onLeave = (event: Event) => {
      const from = productOf(event.target);
      const to = productOf((event as PointerEvent | FocusEvent).relatedTarget);
      if (from && from !== to) setActiveProduct(to);
    };
    document.addEventListener("pointerover", onEnter);
    document.addEventListener("focusin", onEnter);
    document.addEventListener("pointerout", onLeave);
    document.addEventListener("focusout", onLeave);
    return () => {
      document.removeEventListener("pointerover", onEnter);
      document.removeEventListener("focusin", onEnter);
      document.removeEventListener("pointerout", onLeave);
      document.removeEventListener("focusout", onLeave);
      setActiveProduct(null);
    };
  }, []);
}
