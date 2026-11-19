import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitlistConsent } from "@/lib/forms/waitlist";

/**
 * POST /api/waitlist/confirm with a fake Resend client. Tokens come from the sign-up route itself, read out
 * of the confirmation email exactly as a person would get them, so these tests hold whatever the token or
 * the link looks like. Each test loads both routes afresh and uses its own address.
 */

const resend = vi.hoisted(() => ({ send: vi.fn(), createContact: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
    contacts = { create: resend.createContact };
  },
}));

const configured = {
  RESEND_API_KEY: "re_test_key",
  CONTACT_FROM_EMAIL: "SmartxDreams <hello@example.com>",
  CONTACT_TO_EMAIL: "team@example.com",
  WAITLIST_SECRET: "a-test-secret-of-at-least-32-characters",
};
const notConfigured = { RESEND_API_KEY: "", CONTACT_FROM_EMAIL: "", CONTACT_TO_EMAIL: "", WAITLIST_SECRET: "", RESEND_WAITLIST_SEGMENT_ID: "" };

async function loadRoutes(env: Record<string, string> = configured) {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ...notConfigured, ...env })) vi.stubEnv(name, value);
  const { POST: signUp } = await import("../route.api");
  const { POST: confirm } = await import("./route.api");
  const { resetRateLimits } = await import("@/lib/api/rate-limit");
  resetRateLimits();
  return { signUp, confirm };
}

const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: JSON.stringify(body),
  });

const confirmRequest = (token: unknown) => json("/api/waitlist/confirm", token === undefined ? {} : { token });

type Email = { from: string; to: string; subject: string; text: string };
/** The first argument of every call to the fake Resend client: the emails, in the order they were sent. */
const sent = () => resend.send.mock.calls.map((call) => call[0] as Email);
const consentRecords = () => sent().filter((email) => email.to === configured.CONTACT_TO_EMAIL);

/** Signs up through the real route and returns the token from the link in the confirmation email. */
async function tokenFor(signUp: (request: Request) => Promise<Response>, email: string): Promise<string> {
  const body = { email, product: "sitelog", consent: true, consentVersion: waitlistConsent.version, website: "", elapsedMs: 8_000 };
  expect((await signUp(json("/api/waitlist", body))).status).toBe(200);
  const text = sent().findLast((message) => message.to === email)?.text ?? "";
  const token = /\/waitlist\/confirm[?#]token=([^\s&]+)/.exec(text)?.[1];
  expect(token).toBeDefined();
  return decodeURIComponent(token ?? "");
}

beforeEach(() => {
  resend.send.mockReset();
  resend.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
  resend.createContact.mockReset();
  resend.createContact.mockResolvedValue({ data: { id: "contact-id" }, error: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("POST /api/waitlist/confirm", () => {
  it("records the consent in the team inbox", async () => {
    const { signUp, confirm } = await loadRoutes();
    const token = await tokenFor(signUp, "confirmed@example.com");
    expect(consentRecords()).toEqual([]);

    const response = await confirm(confirmRequest(token));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const [record, ...more] = consentRecords();
    expect(more).toEqual([]);
    expect(record?.subject).toMatch(/^\[Waitlist\] Confirmed: /);
    for (const part of ["confirmed@example.com", "sitelog", waitlistConsent.version, waitlistConsent.text]) {
      expect(record?.text).toContain(part);
    }
    // No segment is configured, so nobody is added to one.
    expect(resend.createContact).not.toHaveBeenCalled();
  });

  it("answers 200 again for the same link and records nothing new", async () => {
    const { signUp, confirm } = await loadRoutes();
    const token = await tokenFor(signUp, "repeat@example.com");

    expect((await confirm(confirmRequest(token))).status).toBe(200);
    const repeat = await confirm(confirmRequest(token));
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual({ ok: true });
    expect(consentRecords()).toHaveLength(1);
  });

  it("answers 400 for a token that was edited, cut short or made up", async () => {
    const { signUp, confirm } = await loadRoutes();
    const token = await tokenFor(signUp, "tampered@example.com");
    const [data = "", signature = ""] = token.split(".");
    // A different payload under the same signature, half a link, and something that never was a token.
    const bad = [`x${data.slice(1)}.${signature}`, token.slice(0, Math.floor(token.length / 2)), "not-a-token-at-all"];

    for (const value of bad) {
      const response = await confirm(confirmRequest(value));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("invalid_token");
    }
    expect((await confirm(confirmRequest(undefined))).status).toBe(400);
    expect(consentRecords()).toEqual([]);
  });

  it("answers 400 for a token signed with another secret", async () => {
    const first = await loadRoutes({ ...configured, WAITLIST_SECRET: "another-secret-of-at-least-32-characters" });
    const token = await tokenFor(first.signUp, "other-secret@example.com");

    const { confirm } = await loadRoutes();
    const response = await confirm(confirmRequest(token));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_token");
    expect(consentRecords()).toEqual([]);
  });

  it("answers 410 for a link older than its lifetime", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-01T12:00:00.000Z") });
    const { signUp, confirm } = await loadRoutes();
    const usedInTime = await tokenFor(signUp, "in-time@example.com");
    const usedTooLate = await tokenFor(signUp, "expired@example.com");

    // Still good on the sixth day, gone on the eighth.
    vi.setSystemTime(new Date("2026-11-07T12:00:00.000Z"));
    expect((await confirm(confirmRequest(usedInTime))).status).toBe(200);

    vi.setSystemTime(new Date("2026-11-09T12:00:00.000Z"));
    const response = await confirm(confirmRequest(usedTooLate));
    expect(response.status).toBe(410);
    expect((await response.json()).error.code).toBe("expired_token");
    expect(consentRecords()).toHaveLength(1);
    expect(consentRecords()[0]?.text).toContain("in-time@example.com");
  });

  it("answers 503 when the consent record cannot be sent, and lets the person try again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { signUp, confirm } = await loadRoutes();
    const token = await tokenFor(signUp, "retry@example.com");

    resend.send.mockResolvedValueOnce({ data: null, error: { name: "application_error", message: "down", statusCode: 500 } });
    const failed = await confirm(confirmRequest(token));
    expect(failed.status).toBe(503);
    expect((await failed.json()).error.code).toBe("email_unavailable");

    const retried = await confirm(confirmRequest(token));
    expect(retried.status).toBe(200);
    // Two attempts reached Resend; the second one went through.
    expect(consentRecords()).toHaveLength(2);
  });

  it("adds the address to the Resend segment when one is configured, without depending on it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { signUp, confirm } = await loadRoutes({ ...configured, RESEND_WAITLIST_SEGMENT_ID: "seg_test" });

    const token = await tokenFor(signUp, "segment@example.com");
    expect((await confirm(confirmRequest(token))).status).toBe(200);
    expect(resend.createContact).toHaveBeenCalledTimes(1);
    expect(resend.createContact.mock.calls[0]?.[0]).toMatchObject({ email: "segment@example.com", segments: [{ id: "seg_test" }] });

    // A failed sync is logged without the address and does not undo the confirmation.
    resend.createContact.mockRejectedValueOnce(new TypeError("fetch failed"));
    const second = await tokenFor(signUp, "segment-down@example.com");
    expect((await confirm(confirmRequest(second))).status).toBe(200);
    expect(consentRecords()).toHaveLength(2);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls.flat().join("\n")).not.toContain("segment-down@example.com");
  });

  it("answers 503 when the waitlist is not configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { signUp } = await loadRoutes();
    const token = await tokenFor(signUp, "unconfigured@example.com");

    const { confirm } = await loadRoutes(notConfigured);
    const response = await confirm(confirmRequest(token));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(consentRecords()).toEqual([]);
  });

  it("answers 429 with Retry-After once one client has sent too many", async () => {
    const { confirm } = await loadRoutes();
    for (let i = 0; i < 10; i++) expect((await confirm(confirmRequest("not-a-token-at-all"))).status).toBe(400);

    const response = await confirm(confirmRequest("not-a-token-at-all"));
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("rate_limited");
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
  });

  it("answers 415 for a body that is not JSON by type", async () => {
    const { confirm } = await loadRoutes();
    const request = new Request("http://localhost/api/waitlist/confirm", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "token" });
    const response = await confirm(request);
    expect(response.status).toBe(415);
    expect((await response.json()).error.code).toBe("unsupported_media_type");
  });
});
