"use client";

import { useRef } from "react";
import {
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  type Texture,
  TextureLoader,
  Vector2,
  Vector4,
} from "three";
import { SCENE_PRIORITY } from "@/components/webgl/scene-budget";
import { useThreeRenderer } from "@/components/webgl/useThreeRenderer";
import { pickPlateVariant } from "./plate";
import { plateBreakpointFor, plateRect, plateUniform } from "./plate-layout";
import { plateFragmentShader, plateVertexShader } from "./plate-shader";

/** How long the scene takes to fade in over the CSS fallback. */
const FADE_IN_MS = 700;

/** The hero's ink (#0F1226), premultiplied, painted outside the planet until the starfield sky lies beneath. */
const INK_SKY = new Vector4(0x0f / 255, 0x12 / 255, 0x26 / 255, 1);

/**
 * The three.js Earth backdrop: the painted plate from public/brand/earth, masked to the planet's oval.
 * Loaded only through LazyScene, so three.js is a separate chunk.
 *
 * The plate variant is picked from the device pixels the plate covers, and a sharper one is loaded if a
 * resize needs it. The canvas stays transparent until the texture has loaded, then fades in.
 */
export default function EarthScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useThreeRenderer(
    hostRef,
    (renderer) => {
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quad = new PlaneGeometry(2, 2);
      const canvas = renderer.domElement;

      const material = new ShaderMaterial({
        vertexShader: plateVertexShader,
        fragmentShader: plateFragmentShader,
        uniforms: {
          uPlate: { value: null },
          uPlateRect: { value: new Vector4(0, 0, 1, 1) },
          uResolution: { value: new Vector2(1, 1) },
          uReady: { value: 0 },
          uSky: { value: INK_SKY },
          uTime: { value: 0 },
        },
        // The quad covers the canvas and writes premultiplied colour straight to it.
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      });
      const scene = new Scene();
      const mesh = new Mesh(quad, material);
      // The vertex shader ignores the camera, so culling must not apply.
      mesh.frustumCulled = false;
      scene.add(mesh);

      // The plate texture: the narrowest variant that covers the plate's device pixels, upgraded on a resize
      // that needs more. The texture is used as stored (sRGB values straight to the canvas), without mipmaps
      // since it is never drawn much smaller than a variant.
      const loader = new TextureLoader();
      let texture: Texture | null = null;
      let requestedWidth = 0;
      let disposed = false;
      const loadPlate = (pixels: number) => {
        const variant = pickPlateVariant(pixels);
        if (variant.width <= requestedWidth) return;
        requestedWidth = variant.width;
        loader.load(variant.src, (loaded) => {
          if (disposed) return loaded.dispose();
          loaded.minFilter = LinearFilter;
          loaded.magFilter = LinearFilter;
          loaded.generateMipmaps = false;
          texture?.dispose();
          texture = loaded;
          material.uniforms.uPlate!.value = loaded;
          material.uniforms.uReady!.value = 1;
        });
      };

      // Fade in over the CSS fallback once the plate is on screen, instead of popping in.
      canvas.style.opacity = "0";
      canvas.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
      let shown = false;
      let fadeFrame = 0;

      return {
        scene,
        camera,
        update: (elapsed) => {
          material.uniforms.uTime!.value = elapsed;
          if (!shown && material.uniforms.uReady!.value === 1) {
            shown = true;
            // After this frame reaches the screen.
            fadeFrame = requestAnimationFrame(() => (canvas.style.opacity = "1"));
          }
        },
        resize: (width, height) => {
          // The breakpoint follows the viewport, like the CSS fallback's media queries.
          const rect = plateRect(plateBreakpointFor(window.innerWidth).symbol, width / height);
          material.uniforms.uPlateRect!.value.set(...plateUniform(rect));
          material.uniforms.uResolution!.value.set(width, height);
          loadPlate(rect.width * height * Math.min(window.devicePixelRatio || 1, 2));
        },
        dispose: () => {
          disposed = true;
          cancelAnimationFrame(fadeFrame);
          texture?.dispose();
          quad.dispose();
          material.dispose();
        },
      };
    },
    { id: "earth", priority: SCENE_PRIORITY.earth },
  );

  // useThreeRenderer creates the canvas in here, a new one on every mount.
  return <div ref={hostRef} className="absolute inset-0" />;
}
