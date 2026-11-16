"use client";

import { useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
} from "three";
import { MAX_SCENE_DPR, useThreeRenderer } from "@/components/webgl/useThreeRenderer";
import { starFragmentShader, starVertexShader } from "./star-shader";
import { CONSTELLATION_Z, constellations } from "./constellations";
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

    // Product constellations: faint violet lines joining a few points each, drifting with the stars.
    const lineSets = constellations.map((c) => {
      const positions: number[] = [];
      for (const [a, b] of c.lines) {
        const pa = c.points[a];
        const pb = c.points[b];
        if (!pa || !pb) continue;
        positions.push(pa[0], pa[1], CONSTELLATION_Z, pb[0], pb[1], CONSTELLATION_Z);
      }
      const lineGeometry = new BufferGeometry();
      lineGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
      const lineMaterial = new LineBasicMaterial({
        color: new Color(0xaa97ff),
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      const lines = new LineSegments(lineGeometry, lineMaterial);
      points.add(lines);
      return { slug: c.slug, geometry: lineGeometry, material: lineMaterial };
    });

    // Pointer parallax: the camera eases toward the pointer, so near stars move more than far ones.
    // Fine pointers only; touch screens keep a steady sky.
    const target = { x: 0, y: 0 };
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return {
      scene,
      camera,
      update: (elapsed, delta) => {
        material.uniforms.uTime!.value = elapsed;
        // Slow drift: a full turn would take about 26 minutes, so it reads as stillness with life in it.
        points.rotation.z = elapsed * 0.004;
        points.rotation.y = Math.sin(elapsed * 0.05) * 0.04;
        // Damped follow: about 3 per second of the remaining distance, independent of frame rate.
        const k = Math.min(1, delta * 3);
        camera.position.x += (target.x * 0.35 - camera.position.x) * k;
        camera.position.y += (-target.y * 0.25 - camera.position.y) * k;
        camera.lookAt(0, 0, -3);
      },
      resize: (width, height) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      },
      dispose: () => {
        for (const set of lineSets) {
          set.geometry.dispose();
          set.material.dispose();
        }
        window.removeEventListener("pointermove", onPointerMove);
        geometry.dispose();
        material.dispose();
      },
    };
  });

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" />;
}
