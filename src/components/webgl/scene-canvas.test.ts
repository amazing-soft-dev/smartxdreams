import { describe, expect, it, vi } from "vitest";
import { mountSceneCanvas, SCENE_CANVAS_CLASS } from "./scene-canvas";

/** Just enough of a DOM for the helper: a host whose document makes canvases that can remove themselves. */
function fakeHost() {
  const children: unknown[] = [];
  const created: { className: string; remove: () => void }[] = [];
  const host = {
    ownerDocument: {
      createElement: vi.fn((tag: string) => {
        expect(tag).toBe("canvas");
        const canvas = {
          className: "",
          remove: () => children.splice(children.indexOf(canvas), 1),
        };
        created.push(canvas);
        return canvas;
      }),
    },
    appendChild: vi.fn((child: unknown) => children.push(child)),
  };
  return { host: host as unknown as HTMLElement, children, created };
}

describe("mountSceneCanvas", () => {
  it("appends a canvas that fills the host by default", () => {
    const { host, children } = fakeHost();
    const { canvas } = mountSceneCanvas(host);
    expect(children).toEqual([canvas]);
    expect(canvas.className).toBe(SCENE_CANVAS_CLASS);
  });

  it("uses the given classes", () => {
    const { host } = fakeHost();
    expect(mountSceneCanvas(host, "absolute inset-0").canvas.className).toBe("absolute inset-0");
  });

  it("removes the canvas from the host", () => {
    const { host, children } = fakeHost();
    mountSceneCanvas(host).remove();
    expect(children).toEqual([]);
  });

  it("creates a different canvas on every mount, so a remount never reuses a released context", () => {
    const { host, children, created } = fakeHost();
    const first = mountSceneCanvas(host);
    first.remove();
    const second = mountSceneCanvas(host);
    expect(second.canvas).not.toBe(first.canvas);
    expect(created).toHaveLength(2);
    expect(children).toEqual([second.canvas]);
  });
});
