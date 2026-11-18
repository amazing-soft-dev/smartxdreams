import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fallbackDrifts } from "./EarthFallback";

describe("fallbackDrifts", () => {
  it("drifts where the scene will never run and motion is welcome", () => {
    expect(fallbackDrifts({ status: "fallback", reason: "no-webgl" })).toBe(true);
    expect(fallbackDrifts({ status: "fallback", reason: "save-data" })).toBe(true);
    expect(fallbackDrifts({ status: "fallback", reason: "low-power" })).toBe(true);
  });

  it("keeps still for reduced motion", () => {
    expect(fallbackDrifts({ status: "fallback", reason: "reduced-motion" })).toBe(false);
  });

  it("keeps still under the scene, and while it is undecided (the server render)", () => {
    expect(fallbackDrifts({ status: "ok" })).toBe(false);
    expect(fallbackDrifts({ status: "pending" })).toBe(false);
  });
});

describe("the drift's CSS", () => {
  const css = readFileSync("src/components/earth/EarthFallback.module.css", "utf8");

  it("is the scene's orbital drift: 12 px on a 114 s sine, 4.5 px on a 146 s one, as half-period runs", () => {
    expect(css).toMatch(/--drift-x: -12px;[\s\S]*--drift-x: 12px;/);
    expect(css).toMatch(/--drift-y: -4\.5px;[\s\S]*--drift-y: 4\.5px;/);
    expect(css).toContain("drift-x 57s ease-in-out -28.5s infinite alternate");
    expect(css).toContain("drift-y 73s ease-in-out -36.5s infinite alternate");
    // 2π / 0.055 and 2π / 0.043, the shader's rates, in whole seconds.
    expect(Math.round((2 * Math.PI) / 0.055)).toBe(114);
    expect(Math.round((2 * Math.PI) / 0.043)).toBe(146);
  });

  it("runs only on a drifting fallback, and never with reduced motion", () => {
    expect(css).toContain(".root[data-drift] .plate {");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.root\[data-drift\] \.plate \{\s*animation: none;/);
  });
});
