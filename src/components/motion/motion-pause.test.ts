import { describe, expect, it, vi } from "vitest";
import { createMotionPauseStore, MOTION_PAUSED_ATTRIBUTE, MOTION_PAUSED_KEY } from "./motion-pause";

/** A root element that records its attributes, and a storage that keeps its items in a map. */
function fakeEnvironment(initial: Record<string, string> = {}) {
  const attributes = new Set<string>();
  const items = new Map(Object.entries(initial));
  const root = {
    toggleAttribute: (name: string, force?: boolean) => {
      if (force ?? !attributes.has(name)) attributes.add(name);
      else attributes.delete(name);
      return attributes.has(name);
    },
  };
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
  return { attributes, items, root: () => root, storage: () => storage };
}

describe("createMotionPauseStore", () => {
  it("starts unpaused, with no attribute and nothing stored", () => {
    const env = fakeEnvironment();
    const store = createMotionPauseStore(env);
    expect(store.isPaused()).toBe(false);
    expect(env.attributes.size).toBe(0);
    expect(env.items.size).toBe(0);
  });

  it("pausing sets the root attribute, remembers the choice and tells subscribers", () => {
    const env = fakeEnvironment();
    const store = createMotionPauseStore(env);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(true);
    expect(store.isPaused()).toBe(true);
    expect(env.attributes.has(MOTION_PAUSED_ATTRIBUTE)).toBe(true);
    expect(env.items.get(MOTION_PAUSED_KEY)).toBe("1");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("resuming removes the attribute and forgets the choice", () => {
    const env = fakeEnvironment();
    const store = createMotionPauseStore(env);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(true);
    store.set(false);
    expect(store.isPaused()).toBe(false);
    expect(env.attributes.has(MOTION_PAUSED_ATTRIBUTE)).toBe(false);
    expect(env.items.has(MOTION_PAUSED_KEY)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not tell subscribers when nothing changes, or after they unsubscribe", () => {
    const store = createMotionPauseStore(fakeEnvironment());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(false);
    expect(listener).not.toHaveBeenCalled();
    store.set(true);
    store.set(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("restores a remembered pause on the next page", () => {
    const first = fakeEnvironment();
    createMotionPauseStore(first).set(true);

    // A new page: a fresh store and root element over the same storage.
    const next = fakeEnvironment(Object.fromEntries(first.items));
    const store = createMotionPauseStore(next);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.isPaused()).toBe(false);

    store.restore();
    expect(store.isPaused()).toBe(true);
    expect(next.attributes.has(MOTION_PAUSED_ATTRIBUTE)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("restores nothing when no choice, or another value, was stored", () => {
    const cases: Record<string, string>[] = [{}, { [MOTION_PAUSED_KEY]: "0" }, { [MOTION_PAUSED_KEY]: "true" }];
    for (const stored of cases) {
      const env = fakeEnvironment(stored);
      const store = createMotionPauseStore(env);
      store.restore();
      expect(store.isPaused()).toBe(false);
      expect(env.attributes.size).toBe(0);
    }
  });

  it("still pauses and resumes for this page when storage is blocked", () => {
    const env = fakeEnvironment();
    const blocked = () => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    };
    const store = createMotionPauseStore({ root: env.root, storage: blocked });
    const listener = vi.fn();
    store.subscribe(listener);

    expect(() => store.restore()).not.toThrow();
    expect(store.isPaused()).toBe(false);
    expect(() => store.set(true)).not.toThrow();
    expect(store.isPaused()).toBe(true);
    expect(env.attributes.has(MOTION_PAUSED_ATTRIBUTE)).toBe(true);
    expect(() => store.set(false)).not.toThrow();
    expect(store.isPaused()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("still pauses when a write fails (storage full or read-only)", () => {
    const env = fakeEnvironment();
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      },
      removeItem: () => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      },
    };
    const store = createMotionPauseStore({ root: env.root, storage: () => full });
    expect(() => store.set(true)).not.toThrow();
    expect(store.isPaused()).toBe(true);
    expect(() => store.set(false)).not.toThrow();
    expect(store.isPaused()).toBe(false);
  });
});
