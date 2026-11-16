/** Classes for a scene canvas: fill the host box, which the scene component positions. */
export const SCENE_CANVAS_CLASS = "absolute inset-0 size-full";

export type SceneCanvas = {
  canvas: HTMLCanvasElement;
  /** Takes the canvas out of the host. Call after the renderer has released its context. */
  remove: () => void;
};

/**
 * Creates a new canvas inside `host` for one renderer mount.
 *
 * A canvas keeps the first WebGL context it hands out for as long as it lives, even after that context is
 * lost: once a renderer has called `forceContextLoss()`, `getContext()` on the same element only ever returns
 * the dead context. React reuses the DOM node it rendered when an effect re-runs without unmounting the
 * element (Strict Mode's mount, unmount, mount in development, or `<Activity>` hiding and showing a tree), so
 * a renderer drawing to a React-rendered `<canvas>` breaks on its second mount. A canvas created inside the
 * effect and removed in its cleanup gives every mount a fresh context.
 */
export function mountSceneCanvas(host: HTMLElement, className: string = SCENE_CANVAS_CLASS): SceneCanvas {
  const canvas = host.ownerDocument.createElement("canvas");
  canvas.className = className;
  host.appendChild(canvas);
  return { canvas, remove: () => canvas.remove() };
}
