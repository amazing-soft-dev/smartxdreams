import { describe, expect, it, vi } from "vitest";
import { getLiveWebGL2Context, SCENE_CONTEXT_ATTRIBUTES } from "./webgl-context";

function fakeCanvas(getContext: (type: string, attributes?: WebGLContextAttributes) => unknown) {
  const spy = vi.fn(getContext);
  return { canvas: { getContext: spy } as unknown as HTMLCanvasElement, getContext: spy };
}

function fakeContext(lost: boolean) {
  return { isContextLost: () => lost } as unknown as WebGL2RenderingContext;
}

describe("getLiveWebGL2Context", () => {
  it("returns a live WebGL 2 context, asked for with the scene attributes", () => {
    const gl = fakeContext(false);
    const { canvas, getContext } = fakeCanvas(() => gl);
    expect(getLiveWebGL2Context(canvas)).toBe(gl);
    expect(getContext).toHaveBeenCalledExactlyOnceWith("webgl2", SCENE_CONTEXT_ATTRIBUTES);
  });

  it("passes custom attributes through", () => {
    const attributes = { alpha: false };
    const { canvas, getContext } = fakeCanvas(() => fakeContext(false));
    getLiveWebGL2Context(canvas, attributes);
    expect(getContext).toHaveBeenCalledWith("webgl2", attributes);
  });

  it("returns null for a context that is already lost (the remount case)", () => {
    const { canvas } = fakeCanvas(() => fakeContext(true));
    expect(getLiveWebGL2Context(canvas)).toBeNull();
  });

  it("returns null without WebGL 2, and never falls back to WebGL 1", () => {
    const { canvas, getContext } = fakeCanvas((type) => (type === "webgl" ? fakeContext(false) : null));
    expect(getLiveWebGL2Context(canvas)).toBeNull();
    expect(getContext).not.toHaveBeenCalledWith("webgl", expect.anything());
  });

  it("returns null when getContext throws", () => {
    const { canvas } = fakeCanvas(() => {
      throw new Error("blocked");
    });
    expect(getLiveWebGL2Context(canvas)).toBeNull();
  });

  it("keeps three.js's defaults for the attributes it reads back", () => {
    expect(SCENE_CONTEXT_ATTRIBUTES).toMatchObject({ depth: true, stencil: false, premultipliedAlpha: true, alpha: true });
  });
});
