"use client";

import { useRef } from "react";
import {
  DataTexture,
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
import { EARTH_IGNORE_SELECTOR, EARTH_POINTER_QUERY, isOnEarth, splatCount } from "./earth-pointer";
import { createFluid } from "./fluid";
import { EMBLEM_MASK_SRC, pickPlateVariant } from "./plate";
import { type PlateRect, plateBreakpointFor, plateRect, plateUniform } from "./plate-layout";
import { plateFragmentShader, plateVertexShader } from "./plate-shader";

/** How long the scene takes to fade in over the CSS fallback. */
const FADE_IN_MS = 700;

/** Below this peak displacement (cells) the wake counts as settled and the simulation stops stepping. */
const SETTLED = 0.02;

/** Nothing outside the planet and its glow: the starfield sky in the fallback underneath shows through. */
const CLEAR_SKY = new Vector4(0, 0, 0, 0);

/**
 * The three.js Earth backdrop: the painted plate from public/brand/earth, masked to the planet's oval.
 * Loaded only through LazyScene, so three.js is a separate chunk.
 *
 * The plate variant is picked from the device pixels the plate covers, and a sharper one is loaded if a
 * resize needs it. The canvas stays transparent until the texture has loaded, then fades in.
 *
 * A fine pointer moving over the planet (see earth-pointer.ts) stirs a small fluid simulation (fluid.ts)
 * whose displacement moves the plate; the simulation only steps while that wake is still moving.
 */
export default function EarthScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useThreeRenderer(
    hostRef,
    (renderer) => {
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quad = new PlaneGeometry(2, 2);
      const canvas = renderer.domElement;

      // The fluid wake: simulated on the CPU, uploaded as a small texture while it moves.
      const fluid = createFluid();
      const flowPixels = new Uint8Array(fluid.width * fluid.height * 4);
      fluid.pack(flowPixels);
      const flow = new DataTexture(flowPixels, fluid.width, fluid.height);
      flow.minFilter = LinearFilter;
      flow.magFilter = LinearFilter;
      flow.needsUpdate = true;
      let flowing = false;
      let rect: PlateRect = { left: 0, bottom: 0, width: 1, height: 1 };

      // The cloud emblem's mask: until it has loaded, a white pixel, so the whole plate counts as emblem and the
      // cyclone holds still rather than bending the emblem for a moment.
      const placeholderEmblem = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
      placeholderEmblem.needsUpdate = true;
      let emblem: Texture | null = null;

      const material = new ShaderMaterial({
        vertexShader: plateVertexShader,
        fragmentShader: plateFragmentShader,
        uniforms: {
          uPlate: { value: null },
          uPlateRect: { value: new Vector4(0, 0, 1, 1) },
          uResolution: { value: new Vector2(1, 1) },
          uReady: { value: 0 },
          uSky: { value: CLEAR_SKY },
          uTime: { value: 0 },
          uFlow: { value: flow },
          uEmblem: { value: placeholderEmblem },
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

      loader.load(EMBLEM_MASK_SRC, (loaded) => {
        if (disposed) return loaded.dispose();
        loaded.minFilter = LinearFilter;
        loaded.magFilter = LinearFilter;
        loaded.generateMipmaps = false;
        emblem = loaded;
        material.uniforms.uEmblem!.value = loaded;
      });

      // Pointer moves over the planet splat into the fluid, broken into short steps along the path. The
      // sky, the limb, the page's controls, touch and coarse pointers never stir it.
      const finePointer = window.matchMedia(EARTH_POINTER_QUERY);
      let last: { x: number; y: number } | null = null;
      const onPointerMove = (event: PointerEvent) => {
        if (!finePointer.matches || event.pointerType === "touch") return;
        const target = event.target instanceof Element ? event.target : null;
        const box = canvas.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        const over = x >= 0 && y >= 0 && x <= box.width && y <= box.height && box.height > 0;
        if (!over || target?.closest(EARTH_IGNORE_SELECTOR) || !isOnEarth(rect, x / box.height, 1 - y / box.height)) {
          last = null;
          return;
        }
        if (last) {
          const count = splatCount(x - last.x, y - last.y);
          for (let i = 1; i <= count; i++) {
            const t = i / count;
            fluid.splat(
              (last.x + (x - last.x) * t) / box.width,
              1 - (last.y + (y - last.y) * t) / box.height,
              (x - last.x) / box.width / count,
              -(y - last.y) / box.height / count,
            );
          }
          flowing = true;
        }
        last = { x, y };
      };
      const onPointerLeave = () => {
        last = null;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);

      // Fade in over the CSS fallback once the plate is on screen, instead of popping in.
      canvas.style.opacity = "0";
      canvas.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
      let shown = false;
      let fadeFrame = 0;

      return {
        scene,
        camera,
        update: (elapsed, delta) => {
          material.uniforms.uTime!.value = elapsed;
          if (flowing) {
            fluid.step(delta);
            if (fluid.peak() < SETTLED) {
              fluid.reset();
              flowing = false;
            }
            fluid.pack(flowPixels);
            flow.needsUpdate = true;
          }
          if (!shown && material.uniforms.uReady!.value === 1) {
            shown = true;
            // After this frame reaches the screen.
            fadeFrame = requestAnimationFrame(() => (canvas.style.opacity = "1"));
          }
        },
        resize: (width, height) => {
          // The breakpoint follows the viewport (width and aspect), like the CSS fallback's media queries.
          rect = plateRect(plateBreakpointFor(window.innerWidth, window.innerHeight).symbol, width / height);
          material.uniforms.uPlateRect!.value.set(...plateUniform(rect));
          material.uniforms.uResolution!.value.set(width, height);
          loadPlate(rect.width * height * Math.min(window.devicePixelRatio || 1, 2));
        },
        dispose: () => {
          disposed = true;
          cancelAnimationFrame(fadeFrame);
          window.removeEventListener("pointermove", onPointerMove);
          document.documentElement.removeEventListener("pointerleave", onPointerLeave);
          flow.dispose();
          texture?.dispose();
          emblem?.dispose();
          placeholderEmblem.dispose();
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
