"use client";

import { useSyncExternalStore } from "react";

/**
 * "Pause animations": the visitor's switch for motion that runs on its own for more than five seconds
 * (WCAG 2.2.2), for those who have not set the operating system's reduced-motion preference. The footer's
 * toggle flips it.
 *
 * One source of truth, in two forms: an attribute on <html> for CSS (globals.css holds every looping CSS
 * animation under it) and this tiny external store for script-driven loops, which stop their interval or
 * frame loop while it is set and carry on from the same frame when it clears.
 *
 * The choice is remembered in localStorage and applied after hydration (restoreMotionPaused(), called once
 * by the toggle), so the server markup never depends on it: every page starts unpaused on the server and
 * in the first client render.
 */

/** Set on the root element while paused. */
export const MOTION_PAUSED_ATTRIBUTE = "data-motion-paused";
/** localStorage key: "1" while paused, absent otherwise. */
export const MOTION_PAUSED_KEY = "motion-paused";

type Environment = {
  /** The element that carries the attribute. */
  root: () => Pick<Element, "toggleAttribute">;
  /** May throw (storage blocked by the browser or a privacy mode), like every call on what it returns. */
  storage: () => Pick<Storage, "getItem" | "setItem" | "removeItem">;
};

export type MotionPauseStore = {
  subscribe: (listener: () => void) => () => void;
  isPaused: () => boolean;
  /** Pauses or resumes, and remembers the choice. */
  set: (paused: boolean) => void;
  /** Applies the remembered choice, if there is one. */
  restore: () => void;
};

export function createMotionPauseStore({ root, storage }: Environment): MotionPauseStore {
  let paused = false;
  const listeners = new Set<() => void>();

  const apply = (next: boolean) => {
    if (next === paused) return;
    paused = next;
    root().toggleAttribute(MOTION_PAUSED_ATTRIBUTE, next);
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isPaused: () => paused,
    set(next) {
      apply(next);
      try {
        if (next) storage().setItem(MOTION_PAUSED_KEY, "1");
        else storage().removeItem(MOTION_PAUSED_KEY);
      } catch {
        // Storage is unavailable: the choice still holds for this page, it is just not remembered.
      }
    },
    restore() {
      try {
        if (storage().getItem(MOTION_PAUSED_KEY) === "1") apply(true);
      } catch {
        // Storage is unavailable: nothing was remembered.
      }
    },
  };
}

const store = createMotionPauseStore({
  root: () => document.documentElement,
  storage: () => window.localStorage,
});

export const subscribeMotionPaused = store.subscribe;
export const isMotionPaused = store.isPaused;
export const setMotionPaused = store.set;
export const restoreMotionPaused = store.restore;

/**
 * True while the visitor has paused animations. False on the server and in the first client render, so
 * rendering never differs between them; an effect that depends on it re-runs when it changes.
 */
export function useMotionPaused(): boolean {
  return useSyncExternalStore(
    store.subscribe,
    store.isPaused,
    () => false,
  );
}
