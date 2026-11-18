import { describe, expect, it } from "vitest";
import { firstConfirmation, forgetConfirmation, mayEmailSignup, normalizeEmail, recordSignupEmail } from "./waitlist-dedupe";
import { type WaitlistTokenPayload, createToken, verifyToken } from "./waitlist-token";

const secret = "test-secret-that-is-at-least-32-characters";
const payload: WaitlistTokenPayload = {
  e: "ann@example.com",
  p: "senioraiplans",
  cv: "2026-11-15",
  ca: "2026-11-15T10:00:00.000Z",
  exp: 2_000_000,
};

describe("waitlist tokens", () => {
  it("round-trip a signed payload", () => {
    expect(verifyToken(secret, createToken(secret, payload), 1_000_000)).toEqual({ valid: true, payload });
  });

  it("reject expired, edited, re-signed and malformed tokens", () => {
    const token = createToken(secret, payload);
    expect(verifyToken(secret, token, 3_000_000)).toEqual({ valid: false, reason: "expired" });
    const [data, signature] = token.split(".");
    const edited = Buffer.from(JSON.stringify({ ...payload, p: "sitelog" })).toString("base64url");
    expect(verifyToken(secret, `${edited}.${signature}`, 1_000_000)).toEqual({ valid: false, reason: "bad-signature" });
    expect(verifyToken("another-secret-also-32-characters-long", token, 1_000_000).valid).toBe(false);
    expect(verifyToken(secret, `${data}`, 1_000_000)).toEqual({ valid: false, reason: "malformed" });
    expect(verifyToken(secret, "a.b.c", 1_000_000)).toEqual({ valid: false, reason: "malformed" });
  });
});

describe("waitlist duplicate handling", () => {
  it("normalises addresses", () => {
    expect(normalizeEmail("  Ann@Example.COM ")).toBe("ann@example.com");
  });

  it("allows two confirmation emails a day per address and product, counting only sent ones", () => {
    const t = 5_000_000;
    expect(mayEmailSignup("dup@example.com", "senioraiplans", t)).toBe(true);
    recordSignupEmail("dup@example.com", "senioraiplans", t);
    recordSignupEmail("DUP@example.com", "senioraiplans", t + 1);
    expect(mayEmailSignup("dup@example.com", "senioraiplans", t + 2)).toBe(false);
    expect(mayEmailSignup("dup@example.com", "sitelog", t + 2)).toBe(true);
    expect(mayEmailSignup("dup@example.com", "senioraiplans", t + 24 * 60 * 60_000)).toBe(true);
  });

  it("records a confirmation once, and again after a failed record is forgotten", () => {
    const exp = Date.now() + 60_000;
    expect(firstConfirmation("token-a", exp)).toBe(true);
    expect(firstConfirmation("token-a", exp)).toBe(false);
    forgetConfirmation("token-a");
    expect(firstConfirmation("token-a", exp)).toBe(true);
  });
});
