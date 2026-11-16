"use client";

import { useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, PerspectiveCamera, Points, Scene, ShaderMaterial } from "three";
import { MAX_SCENE_DPR, useThreeRenderer } from "@/components/webgl/useThreeRenderer";
import { starFragmentShader, starVertexShader } from "./star-shader";
import { createStarField } from "./stars";

/** The three.js star-field. Loaded only through LazyScene, so three.js is a separate chunk. */
export default function AstraScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useThreeRenderer(canvasRef, () => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(55, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    const field = createStarField();
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(field.positions, 3));
    geometry.setAttribute("color", new BufferAttribute(field.colors, 3));
    geometry.setAttribute("size", new BufferAttribute(field.sizes, 1));
    geometry.setAttribute("phase", new BufferAttribute(field.phases, 1));

    const material = new ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, MAX_SCENE_DPR) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    scene.add(points);

    return {
      scene,
      camera,
      update: (elapsed) => {
        material.uniforms.uTime!.value = elapsed;
        // Slow drift: a full turn would take about 26 minutes, so it reads as stillness with life in it.
        points.rotation.z = elapsed * 0.004;
        points.rotation.y = Math.sin(elapsed * 0.05) * 0.04;
      },
      resize: (width, height) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      },
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    };
  });

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" />;
}
