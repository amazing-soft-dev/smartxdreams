import { beforeEach, describe, expect, it } from "vitest";
import { clientIp, rateLimit, resetRateLimits } from "./rate-limit";

const LIMIT = { limit: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit, then refuses with the seconds until the oldest hit expires", () => {
    const t = 1_000_000;
    expect(rateLimit("ip", LIMIT, t).allowed).toBe(true);
    expect(rateLimit("ip", LIMIT, t + 10_000).allowed).toBe(true);
    expect(rateLimit("ip", LIMIT, t + 20_000).allowed).toBe(true);
    expect(rateLimit("ip", LIMIT, t + 30_000)).toEqual({ allowed: false, retryAfterSeconds: 30 });
  });

  it("lets a client back in once the window slides past old hits", () => {
    const t = 2_000_000;
    for (let i = 0; i < 3; i++) rateLimit("ip", LIMIT, t);
    expect(rateLimit("ip", LIMIT, t + 59_999).allowed).toBe(false);
    expect(rateLimit("ip", LIMIT, t + 60_000).allowed).toBe(true);
  });

  it("does not count refused hits", () => {
    const t = 3_000_000;
    for (let i = 0; i < 3; i++) rateLimit("ip", LIMIT, t);
    for (let i = 0; i < 10; i++) rateLimit("ip", LIMIT, t + 1_000);
    expect(rateLimit("ip", LIMIT, t + 60_000).allowed).toBe(true);
  });

  it("counts each key separately", () => {
    const t = 4_000_000;
    for (let i = 0; i < 3; i++) rateLimit("a", LIMIT, t);
    expect(rateLimit("a", LIMIT, t).allowed).toBe(false);
    expect(rateLimit("b", LIMIT, t).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  const request = (headers: Record<string, string>) => new Request("http://localhost/api/contact", { headers });

  it("takes the first x-forwarded-for address", () => {
    expect(clientIp(request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to unknown", () => {
    expect(clientIp(request({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(request({}))).toBe("unknown");
  });
});
