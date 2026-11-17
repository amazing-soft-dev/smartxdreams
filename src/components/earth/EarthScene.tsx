"use client";

import { useRef } from "react";
import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";
import { SCENE_PRIORITY } from "@/components/webgl/scene-budget";
import { useThreeRenderer } from "@/components/webgl/useThreeRenderer";
import { composeFragmentShader, earthVertexShader, planetFragmentShader } from "./earth-shader";
import { earthLayoutFor, planetCircle, planetUniform, stormUniform, sunDirection, symbolUniform } from "./layout";
import { drawSymbolMask, symbolMaskTransform } from "./symbol-mask";
import { createWake, WAKE_GUSTS } from "./wake";

/** How long the scene takes to fade in over the CSS planet. */
const FADE_IN_MS = 700;

/**
 * The three.js Earth backdrop. Loaded only through LazyScene, so three.js is a separate chunk.
 *
 * The planet shader is costly, so it runs once per canvas size into a render target (the "bake"), and every
 * frame only draws that texture, moved by the weather, and the cloud symbol. The bake runs again after a
 * resize, a breakpoint change or a restored WebGL context (a lost context takes the render target's contents
 * with it).
 */
export default function EarthScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useThreeRenderer(
    hostRef,
    (renderer) => {
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quad = new PlaneGeometry(2, 2);

      const planetMaterial = new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: planetFragmentShader,
        uniforms: {
          uResolution: { value: new Vector2(1, 1) },
          uPlanet: { value: new Vector3() },
          uSun: { value: new Vector3(0, 0, 1) },
          uStorm: { value: new Vector3(0, 0, 1) },
        },
        depthTest: false,
        depthWrite: false,
      });
      const bakeScene = new Scene();
      bakeScene.add(fullScreen(quad, planetMaterial));

      const target = new WebGLRenderTarget(1, 1, { depthBuffer: false, generateMipmaps: false });
      target.texture.minFilter = LinearFilter;
      target.texture.magFilter = LinearFilter;

      // Pointer wake, for fine pointers that can hover (not touch screens): the pointer's position in hero
      // heights from the canvas's bottom-left, while it is over the canvas.
      const wake = createWake();
      const wakeGusts = new Float32Array(WAKE_GUSTS * 4);
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
      const canvas = renderer.domElement;
      const onPointerMove = (event: PointerEvent) => {
        if (!finePointer.matches || event.pointerType === "touch") return;
        const box = canvas.getBoundingClientRect();
        const inside =
          event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside || box.height === 0) return wake.leave();
        wake.move((event.clientX - box.left) / box.height, (box.bottom - event.clientY) / box.height, event.timeStamp / 1000);
      };
      const onPointerLeave = () => wake.leave();
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);

      // The symbol's cloud-density mask, drawn once. Without a 2D context the planet shows without it.
      const maskCanvas = drawSymbolMask(document);
      const symbolMask = maskCanvas ? new CanvasTexture(maskCanvas) : null;
      const { coverage } = symbolMaskTransform();

      const composeMaterial = new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: composeFragmentShader,
        uniforms: {
          uBase: { value: target.texture },
          uSymbol: { value: symbolMask },
          // Side 0 hides the symbol until the first resize places it (and for good if there is no mask).
          uSymbolPlace: { value: new Vector4(0, 0, 0, 0) },
          uPlanet: planetMaterial.uniforms.uPlanet!,
          uSun: planetMaterial.uniforms.uSun!,
          uResolution: planetMaterial.uniforms.uResolution!,
          uStorm: planetMaterial.uniforms.uStorm!,
          uTime: { value: 0 },
          uWake: { value: wakeGusts },
        },
        depthTest: false,
        depthWrite: false,
      });
      const scene = new Scene();
      scene.add(fullScreen(quad, composeMaterial));

      // Fade in over the CSS planet once the first frame is drawn, instead of popping in. The fallback has the
      // same geometry, so this reads as the picture coming to life.
      canvas.style.opacity = "0";
      canvas.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
      let shown = false;
      let fadeFrame = 0;

      let dirty = true;
      const buffer = new Vector2();
      const bake = () => {
        renderer.getDrawingBufferSize(buffer);
        target.setSize(buffer.x, buffer.y);
        renderer.setRenderTarget(target);
        renderer.render(bakeScene, camera);
        renderer.setRenderTarget(null);
        dirty = false;
      };
      const onContextRestored = () => {
        dirty = true;
      };
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

      return {
        scene,
        camera,
        update: (elapsed) => {
          if (dirty) bake();
          if (!shown) {
            shown = true;
            // After this frame reaches the screen.
            fadeFrame = requestAnimationFrame(() => (canvas.style.opacity = "1"));
          }
          composeMaterial.uniforms.uTime!.value = elapsed;
          // Event timestamps and performance.now() share a clock.
          wake.write(performance.now() / 1000, wakeGusts);
        },
        resize: (width, height) => {
          // The breakpoint follows the viewport, like the CSS fallback's media queries.
          const layout = earthLayoutFor(window.innerWidth);
          planetMaterial.uniforms.uPlanet!.value.set(...planetUniform(planetCircle(layout.planet), width / height));
          planetMaterial.uniforms.uSun!.value.set(...sunDirection(layout.sunAngle));
          planetMaterial.uniforms.uStorm!.value.set(...stormUniform(layout.storm, width / height));
          planetMaterial.uniforms.uResolution!.value.set(width, height);
          if (symbolMask) composeMaterial.uniforms.uSymbolPlace!.value.set(...symbolUniform(layout.symbol, width / height, coverage));
          dirty = true;
        },
        dispose: () => {
          renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
          cancelAnimationFrame(fadeFrame);
          window.removeEventListener("pointermove", onPointerMove);
          document.documentElement.removeEventListener("pointerleave", onPointerLeave);
          target.dispose();
          symbolMask?.dispose();
          quad.dispose();
          planetMaterial.dispose();
          composeMaterial.dispose();
        },
      };
    },
    { id: "earth", priority: SCENE_PRIORITY.earth },
  );

  // useThreeRenderer creates the canvas in here, a new one on every mount.
  return <div ref={hostRef} className="absolute inset-0" />;
}

/** A quad that always covers the canvas: the vertex shader ignores the camera, so culling must not apply. */
function fullScreen(geometry: PlaneGeometry, material: ShaderMaterial): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}
