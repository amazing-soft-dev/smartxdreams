import { afterEach, describe, expect, it, vi } from "vitest";
import { detectSceneSupport, hasWebGL2 } from "./useSceneSupport";

type FakeContext = { isContextLost: () => boolean; getExtension: (name: string) => unknown };

/** A document whose canvases answer getContext() from `contexts`, recording what was asked for. */
function fakeDocument(contexts: Partial<Record<string, FakeContext | null>>) {
  const requested: string[] = [];
  const doc = {
    createElement: () => ({
      getContext: (type: string) => {
        requested.push(type);
        return contexts[type] ?? null;
      },
    }),
  };
  return { doc: doc as unknown as Document, requested };
}

function fakeContext(lost = false) {
  const loseContext = vi.fn();
  const context: FakeContext = {
    isContextLost: () => lost,
    getExtension: (name) => (name === "WEBGL_lose_context" ? { loseContext } : null),
  };
  return { context, loseContext };
}

/** Stubs the browser globals detectSceneSupport reads; each test overrides what it is about. */
function stubBrowser({
  reducedMotion = false,
  saveData = false,
  cores = 8,
  memory = 8,
  webgl2 = true,
}: { reducedMotion?: boolean; saveData?: boolean; cores?: number; memory?: number; webgl2?: boolean } = {}) {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: reducedMotion }) });
  vi.stubGlobal("navigator", { hardwareConcurrency: cores, deviceMemory: memory, connection: { saveData } });
  vi.stubGlobal("document", fakeDocument(webgl2 ? { webgl2: fakeContext().context } : {}).doc);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hasWebGL2", () => {
  it("is true for a live WebGL 2 context, and frees the probe context", () => {
    const { context, loseContext } = fakeContext();
    expect(hasWebGL2(fakeDocument({ webgl2: context }).doc)).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("is false with WebGL 1 only, and never asks for it", () => {
    const { doc, requested } = fakeDocument({ webgl: fakeContext().context });
    expect(hasWebGL2(doc)).toBe(false);
    expect(requested).toEqual(["webgl2"]);
  });

  it("is false for a context that is lost from the start", () => {
    expect(hasWebGL2(fakeDocument({ webgl2: fakeContext(true).context }).doc)).toBe(false);
  });

  it("is false when getContext throws", () => {
    const doc = {
      createElement: () => ({
        getContext: () => {
          throw new Error("blocked");
        },
      }),
    } as unknown as Document;
    expect(hasWebGL2(doc)).toBe(false);
  });
});

describe("detectSceneSupport", () => {
  it("allows the scene on a capable device", () => {
    stubBrowser();
    expect(detectSceneSupport()).toEqual({ status: "ok" });
  });

  it("falls back without WebGL 2", () => {
    stubBrowser({ webgl2: false });
    expect(detectSceneSupport()).toEqual({ status: "fallback", reason: "no-webgl" });
  });

  it("puts reduced motion, data saver and low power ahead of the WebGL check", () => {
    stubBrowser({ reducedMotion: true, webgl2: false });
    expect(detectSceneSupport()).toEqual({ status: "fallback", reason: "reduced-motion" });
    stubBrowser({ saveData: true });
    expect(detectSceneSupport()).toEqual({ status: "fallback", reason: "save-data" });
    stubBrowser({ cores: 2 });
    expect(detectSceneSupport()).toEqual({ status: "fallback", reason: "low-power" });
    stubBrowser({ memory: 2 });
    expect(detectSceneSupport()).toEqual({ status: "fallback", reason: "low-power" });
  });
});
