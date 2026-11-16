/**
 * Context attributes for decorative three.js scenes: transparent over the CSS fallback, no MSAA (the stars
 * are soft points), and the integrated GPU where there is a choice. depth, stencil and premultipliedAlpha
 * match three.js's own defaults, since three.js reads them from the context it is given.
 */
export const SCENE_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: true,
  stencil: false,
  premultipliedAlpha: true,
  powerPreference: "low-power",
};

/**
 * Returns a usable WebGL 2 context for `canvas`, or null when there is none.
 *
 * three.js creates its own context when it is not given one, and if that fails, or the context is already
 * lost, it logs an error and throws from deep inside `WebGLRenderer` (a lost context reports a null shader
 * precision format, which three.js dereferences). Checking first lets the caller keep the static fallback
 * without an error in the console. three.js r163+ supports WebGL 2 only, so that is all this asks for.
 */
export function getLiveWebGL2Context(
  canvas: HTMLCanvasElement,
  attributes: WebGLContextAttributes = SCENE_CONTEXT_ATTRIBUTES,
): WebGL2RenderingContext | null {
  let gl: WebGL2RenderingContext | null;
  try {
    gl = canvas.getContext("webgl2", attributes);
  } catch {
    return null;
  }
  if (!gl || gl.isContextLost()) return null;
  return gl;
}
