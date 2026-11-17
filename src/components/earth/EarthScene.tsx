"use client";

import { useRef } from "react";
import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import { SCENE_PRIORITY } from "@/components/webgl/scene-budget";
import { useThreeRenderer } from "@/components/webgl/useThreeRenderer";
import { composeFragmentShader, earthVertexShader, planetFragmentShader } from "./earth-shader";
import { earthLayoutFor, planetCircle, planetUniform, sunDirection } from "./layout";

/**
 * The three.js Earth backdrop. Loaded only through LazyScene, so three.js is a separate chunk.
 *
 * The planet shader is costly, so it runs once per canvas size into a render target (the "bake"), and every
 * frame only draws that texture. The bake runs again after a resize, a breakpoint change or a restored WebGL
 * context (a lost context takes the render target's contents with it).
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
        },
        depthTest: false,
        depthWrite: false,
      });
      const bakeScene = new Scene();
      bakeScene.add(fullScreen(quad, planetMaterial));

      const target = new WebGLRenderTarget(1, 1, { depthBuffer: false, generateMipmaps: false });
      target.texture.minFilter = LinearFilter;
      target.texture.magFilter = LinearFilter;

      const composeMaterial = new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: composeFragmentShader,
        uniforms: { uBase: { value: target.texture } },
        depthTest: false,
        depthWrite: false,
      });
      const scene = new Scene();
      scene.add(fullScreen(quad, composeMaterial));

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
        update: () => {
          if (dirty) bake();
        },
        resize: (width, height) => {
          // The breakpoint follows the viewport, like the CSS fallback's media queries.
          const layout = earthLayoutFor(window.innerWidth);
          planetMaterial.uniforms.uPlanet!.value.set(...planetUniform(planetCircle(layout.planet), width / height));
          planetMaterial.uniforms.uSun!.value.set(...sunDirection(layout.sunAngle));
          planetMaterial.uniforms.uResolution!.value.set(width, height);
          dirty = true;
        },
        dispose: () => {
          renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
          target.dispose();
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
