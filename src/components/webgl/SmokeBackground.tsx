"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import { smokeFragmentShader, smokeVertexShader } from "./smoke-shader";

type SmokeBackgroundProps = {
  className?: string;
  /** Overall opacity of the smoke, 0 to 2. */
  intensity?: number;
  /** Noise scale; lower means bigger, softer clouds. */
  scale?: number;
  /** Render at this fraction of the device resolution. Smoke is soft, so half resolution looks the same. */
  quality?: number;
};

/** Brand violet and coral in linear 0-1 RGB. */
const VIOLET = [0x6d / 255, 0x4a / 255, 0xff / 255] as const;
const CORAL = [0xff / 255, 0x6b / 255, 0x3d / 255] as const;
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
  const vertex = compile(gl, gl.VERTEX_SHADER, smokeVertexShader);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, smokeFragmentShader);
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
      colorA: gl.getUniformLocation(program, "uColorA"),
      colorB: gl.getUniformLocation(program, "uColorB"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      scale: gl.getUniformLocation(program, "uScale"),
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

/**
 * Animated WebGL smoke behind the footer. Decorative: aria-hidden and pointer-events none.
 * The canvas renders at `quality` x device pixel ratio (capped at 2) and follows its box with a ResizeObserver.
 */
export function SmokeBackground({ className, intensity = 0.9, scale = 1.6, quality = 0.5 }: SmokeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    const scene = setup(gl);
    if (!scene) return;

    const { uniforms } = scene;
    gl.uniform3fv(uniforms.colorA, VIOLET);
    gl.uniform3fv(uniforms.colorB, CORAL);
    gl.uniform1f(uniforms.intensity, intensity);
    gl.uniform1f(uniforms.scale, scale);
    gl.uniform1f(uniforms.fade, 0.25);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR) * quality;
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uniforms.resolution, width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let frame = 0;
    const start = performance.now();
    const render = (now: number) => {
      gl.uniform1f(uniforms.time, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scene.dispose();
    };
  }, [intensity, scale, quality]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 -z-10 size-full", className)}
    />
  );
}
