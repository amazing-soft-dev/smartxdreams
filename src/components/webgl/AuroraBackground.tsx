"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import { auroraPalette } from "./aurora-palette";
import { auroraFragmentShader, auroraVertexShader } from "./aurora-shader";
import { isTopScene, SCENE_PRIORITY, setSceneVisible } from "./scene-budget";

type AuroraBackgroundProps = {
  className?: string;
  /** Overall strength of the aurora, 0 to 2. */
  intensity?: number;
  /** Height of the horizon the curtains rise from, 0 (bottom) to 1 (top). */
  horizon?: number;
  /** How far down from the top edge the aurora fades out, 0 to 1. */
  fade?: number;
  /** Render at this fraction of the device resolution. The aurora is soft, so half resolution looks the same. */
  quality?: number;
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
 * shows instead.
 */
export function AuroraBackground({ className, intensity = 1, horizon = 0.28, fade = 0.3, quality = 0.5 }: AuroraBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      gl.uniform1f(uniforms.horizon, horizon);
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
      }
      if (scene) gl.uniform2f(scene.uniforms.resolution, width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // Animation time only advances while running, so the aurora resumes where it paused, colours included.
    let frame = 0;
    let elapsed = 0;
    let last = 0;
    let onScreen = false;
    const render = (now: number) => {
      if (last) elapsed += now - last;
      last = now;
      // Yield to a higher-priority visible scene (the hero): keep the last frame.
      if (scene && isTopScene("aurora")) {
        const seconds = elapsed / 1000;
        const { low, high } = auroraPalette(seconds);
        gl.uniform1f(scene.uniforms.time, seconds);
        gl.uniform3fv(scene.uniforms.colorLow, low);
        gl.uniform3fv(scene.uniforms.colorHigh, high);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // The live aurora replaces the still one.
        root.dataset.live = "";
      }
      frame = requestAnimationFrame(render);
    };
    const play = () => {
      if (frame || !onScreen || document.hidden || !scene) return;
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
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      setSceneVisible("aurora", SCENE_PRIORITY.aurora, false);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      scene?.dispose();
      delete root.dataset.live;
    };
  }, [intensity, horizon, fade, quality]);

  // The still aurora's pillars stand on the horizon line.
  const base = `${(1 - horizon) * 100}%`;
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
