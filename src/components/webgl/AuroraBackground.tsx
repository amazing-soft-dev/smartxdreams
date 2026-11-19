"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import { auroraPalette } from "./aurora-palette";
import { auroraFragmentShader, auroraVertexShader } from "./aurora-shader";
import { createPointerTracker, pointerFollowAllowed } from "./pointer-tracker";
import { isTopScene, SCENE_PRIORITY, setSceneVisible } from "./scene-budget";
import { isMotionPaused, subscribeMotionPaused } from "@/components/motion/motion-pause";

type AuroraBackgroundProps = {
  className?: string;
  /** Overall strength of the aurora, 0 to 2. */
  intensity?: number;
  /** Height of the horizon the curtains rise from, 0 (bottom) to 1 (top), when there is no `ridge`. */
  horizon?: number;
  /**
   * A drawn horizon to stand the aurora on: a selector for an element next to the aurora (a sibling's
   * descendant in the same parent), and where its crest runs as a share of that element's height from its
   * top. The horizon line follows it on every resize.
   */
  ridge?: { selector: string; crest: number };
  /** How far down from the top edge the aurora fades out, 0 to 1. */
  fade?: number;
  /** Render at this fraction of the device resolution. The aurora is soft, so half resolution looks the same. */
  quality?: number;
  /**
   * Let the curtains lean toward and brighten under the cursor while it is over the aurora's parent (with
   * a mouse or trackpad, never for touch or reduced motion).
   */
  followPointer?: boolean;
  /**
   * A selector for an element in the aurora's parent that should follow the cursor too: it gets
   * --pointer-x and --pointer-y, the eased cursor from -1 to 1 around the centre (y up), scaled by how
   * present it is, so 0 when the cursor is away.
   */
  parallax?: string;
};

const MAX_DPR = 2;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Sets up the program and a full-screen triangle. Returns null when anything fails. */
function setup(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, auroraVertexShader);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, auroraFragmentShader);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // One oversized triangle covers the viewport with no diagonal seam.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return {
    program,
    uniforms: {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      colorLow: gl.getUniformLocation(program, "uColorLow"),
      colorHigh: gl.getUniformLocation(program, "uColorHigh"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      horizon: gl.getUniformLocation(program, "uHorizon"),
      fade: gl.getUniformLocation(program, "uFade"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      pointerStrength: gl.getUniformLocation(program, "uPointerStrength"),
    },
    dispose: () => {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}

type AuroraProgram = NonNullable<ReturnType<typeof setup>>;

/**
 * The footer aurora, seen from the ground: WebGL curtains in the brand colours that sway, breathe and drift
 * slowly through the palette in aurora-palette.ts. Decorative: aria-hidden and pointer-events none.
 * The canvas renders at `quality` x device pixel ratio (capped at 2) and follows its box with a ResizeObserver.
 * Until the first frame is drawn (and for reduced motion, no WebGL or a failed shader) a still CSS aurora
 * shows instead. With `followPointer`, the curtains near the cursor lean toward it and brighten.
 */
export function AuroraBackground({
  className,
  intensity = 1,
  horizon = 0.28,
  ridge,
  fade = 0.3,
  quality = 0.5,
  followPointer = false,
  parallax,
}: AuroraBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** The horizon line in use, read by the render loop every frame. */
  const horizonRef = useRef(horizon);
  const ridgeSelector = ridge?.selector;
  const ridgeCrest = ridge?.crest ?? 0;

  // Stand the aurora on the drawn ridge: measure where its crest falls in the aurora's box whenever either
  // one resizes, for the shader and for the still aurora's pillars (--aurora-base, from the top). Runs for
  // reduced motion too, which only shows the still aurora.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const crestElement = ridgeSelector ? root.parentElement?.querySelector(ridgeSelector) : null;
    const measure = () => {
      let line = horizon;
      const box = root.getBoundingClientRect();
      if (crestElement && box.height > 0) {
        const crest = crestElement.getBoundingClientRect();
        line = Math.min(1, Math.max(0, (box.bottom - (crest.top + crest.height * ridgeCrest)) / box.height));
      }
      horizonRef.current = line;
      root.style.setProperty("--aurora-base", `${((1 - line) * 100).toFixed(2)}%`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (crestElement) observer.observe(crestElement);
    measure();
    return () => observer.disconnect();
  }, [horizon, ridgeSelector, ridgeCrest]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Reduced motion: keep only the still CSS aurora.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    // Replaced after a lost context is restored; null while the context is lost or a rebuild failed.
    let scene: AuroraProgram | null = setup(gl);
    if (!scene) return;

    /** Sets every uniform that does not change per frame on a freshly set-up program. */
    const applyUniforms = ({ uniforms }: AuroraProgram) => {
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform1f(uniforms.fade, fade);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };
    applyUniforms(scene);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR) * quality;
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        // Sizing the canvas clears it. While the visitor has paused animations no frame follows to fill it
        // again, so the still aurora takes over until they resume.
        if (isMotionPaused()) delete root.dataset.live;
      }
      if (scene) gl.uniform2f(scene.uniforms.resolution, width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // The cursor, eased every frame. Listened for on the aurora's parent (the footer), since the aurora
    // itself never takes the pointer and the links above it must keep working. Passive, and only with a
    // mouse or trackpad.
    const pointer = createPointerTracker();
    const host = followPointer && pointerFollowAllowed((query) => window.matchMedia(query)) ? root.parentElement : null;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = root.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      pointer.move((event.clientX - box.left) / box.width, 1 - (event.clientY - box.top) / box.height);
    };
    const onPointerLeave = () => pointer.leave();
    host?.addEventListener("pointermove", onPointerMove, { passive: true });
    host?.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // The parallax target, written only when the value changes, so a resting cursor costs no style work.
    const follower = host && parallax ? host.querySelector<HTMLElement>(parallax) : null;
    let followerX = 0;
    let followerY = 0;
    const follow = (x: number, y: number) => {
      if (!follower || (Math.abs(x - followerX) < 0.0005 && Math.abs(y - followerY) < 0.0005)) return;
      followerX = x;
      followerY = y;
      follower.style.setProperty("--pointer-x", x.toFixed(4));
      follower.style.setProperty("--pointer-y", y.toFixed(4));
    };

    // Animation time only advances while running, so the aurora resumes where it paused, colours included.
    let frame = 0;
    let elapsed = 0;
    let last = 0;
    let onScreen = false;
    const render = (now: number) => {
      const dt = last ? now - last : 0;
      elapsed += dt;
      last = now;
      const cursor = pointer.step(dt);
      follow((cursor.x * 2 - 1) * cursor.strength, (cursor.y * 2 - 1) * cursor.strength);
      // Yield to a higher-priority visible scene (the hero): keep the last frame.
      if (scene && isTopScene("aurora")) {
        const seconds = elapsed / 1000;
        const { low, high } = auroraPalette(seconds);
        gl.uniform1f(scene.uniforms.time, seconds);
        gl.uniform1f(scene.uniforms.horizon, horizonRef.current);
        gl.uniform2f(scene.uniforms.pointer, cursor.x, cursor.y);
        gl.uniform1f(scene.uniforms.pointerStrength, cursor.strength);
        gl.uniform3fv(scene.uniforms.colorLow, low);
        gl.uniform3fv(scene.uniforms.colorHigh, high);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // The live aurora replaces the still one.
        root.dataset.live = "";
      }
      frame = requestAnimationFrame(render);
    };
    const play = () => {
      if (frame || !onScreen || document.hidden || !scene || isMotionPaused()) return;
      last = 0;
      frame = requestAnimationFrame(render);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Pause while the footer is off-screen and while the tab is hidden.
    const intersection = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        setSceneVisible("aurora", SCENE_PRIORITY.aurora, onScreen);
        if (onScreen) play();
        else pause();
      },
      { rootMargin: "100px 0px" },
    );
    intersection.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    // "Pause animations" (the footer's switch) stops the loop the same way: the canvas keeps its last frame,
    // or the still aurora stays if none was drawn yet, and the curtains carry on from there afterwards.
    const unsubscribePaused = subscribeMotionPaused(() => (isMotionPaused() ? pause() : play()));

    // The browser can drop the context at any time (GPU reset, too many live contexts, a backgrounded mobile
    // tab); the canvas goes blank and the still CSS aurora comes back. preventDefault() asks for the context
    // back. Everything made on the old context is gone, so on restore the program and buffer are built again
    // and the aurora carries on from the same elapsed time.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      pause();
      scene = null;
      delete root.dataset.live;
    };
    const onContextRestored = () => {
      scene = setup(gl);
      if (!scene) return; // Rebuild failed: the still aurora stays.
      gl.viewport(0, 0, canvas.width, canvas.height);
      applyUniforms(scene);
      play();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return () => {
      pause();
      host?.removeEventListener("pointermove", onPointerMove);
      host?.removeEventListener("pointerleave", onPointerLeave);
      follower?.style.removeProperty("--pointer-x");
      follower?.style.removeProperty("--pointer-y");
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      setSceneVisible("aurora", SCENE_PRIORITY.aurora, false);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribePaused();
      resizeObserver.disconnect();
      scene?.dispose();
      delete root.dataset.live;
    };
  }, [intensity, fade, quality, followPointer, parallax]);

  // The still aurora's pillars stand on the horizon line: the measured ridge once known, else `horizon`.
  const base = `var(--aurora-base, ${(1 - horizon) * 100}%)`;
  return (
    <div ref={rootRef} aria-hidden="true" className={cx("group pointer-events-none absolute inset-0 -z-10", className)}>
      {/* Still aurora, after Black Jupiter's pillars: shown until the first frame, and for reduced motion,
          missing WebGL or a failed shader. Faded out under the live one so the two never add up. */}
      <div
        className="absolute inset-0 opacity-70 mix-blend-screen blur-xl transition-opacity duration-1000 group-data-live:opacity-0"
        style={{
          backgroundImage: [
            `radial-gradient(ellipse 7% 60% at 30% ${base}, rgb(170 151 255 / 0.45), rgb(170 151 255 / 0) 70%)`,
            `radial-gradient(ellipse 12% 75% at 52% ${base}, rgb(109 74 255 / 0.55), rgb(109 74 255 / 0) 65%)`,
            `radial-gradient(ellipse 8% 55% at 72% ${base}, rgb(255 107 61 / 0.3), rgb(255 107 61 / 0) 70%)`,
            `radial-gradient(ellipse 10% 45% at 12% ${base}, rgb(139 112 255 / 0.3), rgb(139 112 255 / 0) 70%)`,
            `radial-gradient(ellipse 70% 10% at 50% ${base}, rgb(170 151 255 / 0.35), rgb(170 151 255 / 0) 75%)`,
          ].join(", "),
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
