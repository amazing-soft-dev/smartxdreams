import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

type Mode = { dev: boolean; preview: boolean };
const production: Mode = { dev: false, preview: false };
const preview: Mode = { dev: false, preview: true };
const development: Mode = { dev: true, preview: false };

const header = (mode: Mode, key: string) => securityHeaders(mode).find((h) => h.key === key)?.value;

/** The Content-Security-Policy as a map from directive name to its sources. */
function csp(mode: Mode): Map<string, string[]> {
  const directives = (header(mode, "Content-Security-Policy") ?? "").split(";").map((part) => part.trim().split(/\s+/));
  return new Map(directives.map(([name = "", ...sources]) => [name, sources]));
}

describe("security headers", () => {
  it("send the fixed headers in every mode", () => {
    for (const mode of [production, preview, development]) {
      expect(header(mode, "Strict-Transport-Security")).toMatch(/^max-age=\d{8,}/);
      expect(header(mode, "X-Content-Type-Options")).toBe("nosniff");
      expect(header(mode, "X-Frame-Options")).toBe("DENY");
      expect(header(mode, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(header(mode, "Permissions-Policy")).toContain("camera=()");
      const keys = securityHeaders(mode).map((h) => h.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("keep the policy closed by default in every mode", () => {
    for (const mode of [production, preview, development]) {
      const policy = csp(mode);
      expect(policy.get("default-src")).toEqual(["'self'"]);
      expect(policy.get("object-src")).toEqual(["'none'"]);
      expect(policy.get("base-uri")).toEqual(["'self'"]);
      expect(policy.get("form-action")).toEqual(["'self'"]);
      expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
    }
  });

  it("allow no eval and no outside origin in production", () => {
    const value = header(production, "Content-Security-Policy") ?? "";
    expect(value).not.toContain("'unsafe-eval'");
    expect(value).not.toContain("vercel.live");
    expect(value).not.toMatch(/\bws:/);
    const policy = csp(production);
    expect(policy.get("script-src")).toContain("'self'");
    expect(policy.get("frame-src")).toEqual(["'none'"]);
    expect(policy.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allow the Vercel toolbar on preview deployments, still without eval", () => {
    const policy = csp(preview);
    for (const directive of ["script-src", "connect-src", "img-src", "frame-src"]) {
      expect(policy.get(directive)).toContain("https://vercel.live");
    }
    expect(header(preview, "Content-Security-Policy")).not.toContain("'unsafe-eval'");
    expect(policy.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allow eval and the hot-reload socket in development only", () => {
    const policy = csp(development);
    expect(policy.get("script-src")).toContain("'unsafe-eval'");
    expect(policy.get("connect-src")).toContain("ws:");
    expect(policy.has("upgrade-insecure-requests")).toBe(false);
    expect(header(development, "Content-Security-Policy")).not.toContain("vercel.live");
  });
});
