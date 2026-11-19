import { describe, expect, it, vi } from "vitest";
import { POST as postConfirm } from "@/app/api/waitlist/confirm/route.api";
import { firstConfirmation, forgetConfirmation, mayEmailSignup, normalizeEmail, recordSignupEmail } from "./waitlist-dedupe";
import { recordConfirmation } from "./waitlist-record";
import { type WaitlistTokenPayload, createToken, verifyToken } from "./waitlist-token";

const secret = "test-secret-that-is-at-least-32-characters";

// The confirm route runs for real, except that it signs with the test secret and records nothing.
vi.mock("./waitlist-config", () => ({ waitlistConfig: () => ({ secret: "test-secret-that-is-at-least-32-characters" }) }));
vi.mock("./waitlist-record", () => ({ recordConfirmation: vi.fn() }));
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

  it("confirm a link emailed before a rename for the product under its new name", () => {
    for (const [old, now] of [["kinly", "senioraiplans"], ["jobatlas", "joined"], ["applypilot", "acorn"]] as const) {
      const token = createToken(secret, { ...payload, p: old });
      expect(verifyToken(secret, token, 1_000_000)).toEqual({ valid: true, payload: { ...payload, p: now } });
    }
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

  it("accept a signature only as createToken() writes it", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    // A signature that uses "-" or "_", so the "+/" alphabet spells it differently.
    const tokens = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => createToken(secret, { ...payload, exp: payload.exp + n }));
    const [data = "", signature = ""] = tokens.map((token) => token.split(".")).find((parts) => /[-_]/.test(parts[1] ?? "")) ?? [];
    expect(signature).toHaveLength(43);
    // The last character carries four bits of the MAC and two spare ones, which createToken() leaves at zero.
    const last = alphabet.indexOf(signature.slice(-1));
    expect(last % 4).toBe(0);
    const spellings = [
      ...[1, 2, 3].map((spare) => signature.slice(0, -1) + alphabet[last + spare]),
      `${signature}=`,
      `${signature}\n`,
      ` ${signature}`,
      `${signature.slice(0, 20)} ${signature.slice(20)}`,
      signature.replace(/-/g, "+").replace(/_/g, "/"),
    ];
    expect(new Set([signature, ...spellings]).size).toBe(9);
    for (const spelling of spellings) {
      // Each decodes to the right MAC, and is still not the token.
      expect(Buffer.from(spelling, "base64url").equals(Buffer.from(signature, "base64url"))).toBe(true);
      expect(verifyToken(secret, `${data}.${spelling}`, 1_000_000)).toEqual({ valid: false, reason: "bad-signature" });
    }
    expect(verifyToken(secret, `${data}.${signature}`, 1_000_000).valid).toBe(true);
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

  it("counts one signed payload once, however the rest of the token is spelled", () => {
    const exp = Date.now() + 60_000;
    const [data = "", signature = ""] = createToken(secret, { ...payload, e: "spelling@example.com" }).split(".");
    expect(firstConfirmation(`${data}.${signature}`, exp)).toBe(true);
    expect(firstConfirmation(`${data}.${signature}=`, exp)).toBe(false);
    expect(firstConfirmation(`${data}.${signature}\n`, exp)).toBe(false);
    // A failed record forgotten under one spelling is forgotten for the payload.
    forgetConfirmation(`${data}.${signature}=`);
    expect(firstConfirmation(`${data}.${signature}`, exp)).toBe(true);
    expect(firstConfirmation(`${data}.${signature}`, exp)).toBe(false);
    // Another payload is another confirmation.
    expect(firstConfirmation(createToken(secret, { ...payload, e: "another@example.com" }), exp)).toBe(true);
  });
});

describe("POST /api/waitlist/confirm", () => {
  const confirm = (token: string) =>
    postConfirm(
      new Request("http://localhost/api/waitlist/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
    );

  it("records one consent email for a payload confirmed more than once", async () => {
    const record = vi.mocked(recordConfirmation).mockResolvedValue({ ok: true });
    const token = createToken(secret, { ...payload, e: "twice@example.com", exp: Date.now() + 60_000 });
    expect((await confirm(token)).status).toBe(200);
    expect((await confirm(token)).status).toBe(200);
    // Another spelling of the same token is not a token, and records nothing either.
    expect((await confirm(`${token}=`)).status).toBe(400);
    expect(record).toHaveBeenCalledTimes(1);
  });
});
