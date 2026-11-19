import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productBySlug } from "@/content/selectors";
import { waitlistConsent } from "@/lib/forms/waitlist";

/**
 * POST /api/waitlist with a fake Resend client: no network, and every email the route would send is
 * recorded. Each test loads the route afresh with its own environment, uses its own address and starts
 * with an empty rate limiter.
 */

const resend = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
  },
}));

const configured = {
  RESEND_API_KEY: "re_test_key",
  CONTACT_FROM_EMAIL: "SmartxDreams <hello@example.com>",
  CONTACT_TO_EMAIL: "team@example.com",
  WAITLIST_SECRET: "a-test-secret-of-at-least-32-characters",
};
const notConfigured = { RESEND_API_KEY: "", CONTACT_FROM_EMAIL: "", CONTACT_TO_EMAIL: "", WAITLIST_SECRET: "", RESEND_WAITLIST_SEGMENT_ID: "" };

async function loadRoute(env: Record<string, string> = configured) {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ...notConfigured, ...env })) vi.stubEnv(name, value);
  const { POST } = await import("./route.api");
  const { resetRateLimits } = await import("@/lib/api/rate-limit");
  resetRateLimits();
  return POST;
}

const signup = (email: string, fields: Record<string, unknown> = {}) => ({
  email,
  product: "sitelog",
  consent: true,
  consentVersion: waitlistConsent.version,
  website: "",
  elapsedMs: 8_000,
  ...fields,
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.8", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** The first argument of every call to the fake Resend client: the emails, in the order they were sent. */
const sent = () => resend.send.mock.calls.map((call) => call[0] as { from: string; to: string; subject: string; text: string });

/** Everything written to the server log, as one string. */
function logged(...spies: { mock: { calls: unknown[][] } }[]): string {
  return spies.flatMap((spy) => spy.mock.calls.flat()).join("\n");
}

beforeEach(() => {
  resend.send.mockReset();
  resend.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/waitlist", () => {
  it("emails a confirmation link to the lowercased address and nothing else", async () => {
    const POST = await loadRoute();
    const response = await POST(post(signup("Signup@Example.com")));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const [confirmation, ...more] = sent();
    expect(more).toEqual([]);
    expect(confirmation).toMatchObject({ from: configured.CONTACT_FROM_EMAIL, to: "signup@example.com" });
    expect(confirmation?.subject).toContain(productBySlug("sitelog")?.name);
    // The link carries the token as a query or as a fragment; either way it points at the confirm page.
    expect(confirmation?.text).toMatch(/https?:\/\/\S+\/waitlist\/confirm[?#]token=[\w.%~-]{20,}/);
  });

  it("accepts a renamed product's old slug", async () => {
    const POST = await loadRoute();
    const response = await POST(post(signup("old-slug@example.com", { product: "kinly" })));

    expect(response.status).toBe(200);
    expect(sent()[0]?.subject).toContain(productBySlug("senioraiplans")?.name);
  });

  it("answers 429 with Retry-After once one client has sent too many", async () => {
    const POST = await loadRoute();
    const from = { "x-forwarded-for": "198.51.100.30" };
    // Caught as spam, so nothing is sent, but every request counts towards the limit.
    for (let i = 0; i < 5; i++) expect((await POST(post(signup("limited@example.com", { website: "x" }), from))).status).toBe(200);

    const response = await POST(post(signup("limited@example.com"), from));
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("rate_limited");
    const retryAfter = Number(response.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(600);
    expect(sent()).toEqual([]);
  });

  it("answers 415 for a body that is not JSON by type, and 400 for one that is not JSON by content", async () => {
    const POST = await loadRoute();

    const form = await POST(post("email=ann@example.com", { "Content-Type": "application/x-www-form-urlencoded" }));
    expect(form.status).toBe(415);
    expect((await form.json()).error.code).toBe("unsupported_media_type");

    const broken = await POST(post("{not json"));
    expect(broken.status).toBe(400);
    expect((await broken.json()).error.code).toBe("invalid_json");
    expect(sent()).toEqual([]);
  });

  it("answers 400 with field messages for a bad address, missing consent and old wording", async () => {
    const POST = await loadRoute();
    const cases: [Record<string, unknown>, string][] = [
      [{ email: "not-an-address" }, "email"],
      [{ consent: false }, "consent"],
      [{ product: "no-such-product" }, "product"],
      [{ consentVersion: "2000-01-01" }, "consentVersion"],
    ];

    for (const [fields, field] of cases) {
      const response = await POST(post(signup("invalid@example.com", fields)));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("invalid_input");
      expect(Object.keys(body.error.fields)).toEqual([field]);
      expect(body.error.fields[field]).toMatch(/\S/);
    }
    expect(sent()).toEqual([]);
  });

  it("answers 200 and sends nothing for a filled honeypot, a too-fast submit and a missing timer", async () => {
    const POST = await loadRoute();
    const bodies = [
      signup("honeypot@example.com", { website: "https://spam.example" }),
      signup("fast@example.com", { elapsedMs: 300 }),
      signup("no-timer@example.com", { elapsedMs: undefined }),
    ];

    for (const body of bodies) {
      const response = await POST(post(body));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(sent()).toEqual([]);
  });

  it("answers 503 and sends nothing when email is not configured, without logging the address", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const POST = await loadRoute(notConfigured);
    const response = await POST(post(signup("unconfigured@example.com")));

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(sent()).toEqual([]);
    expect(logged(warn, error)).toContain("WAITLIST_SECRET");
    expect(logged(warn, error)).not.toContain("unconfigured@example.com");
  });

  it("answers 503 when only the signing secret is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const POST = await loadRoute({ ...configured, WAITLIST_SECRET: "" });
    const response = await POST(post(signup("no-secret@example.com")));

    expect(response.status).toBe(503);
    expect(sent()).toEqual([]);
    expect(logged(warn)).toContain("WAITLIST_SECRET");
  });

  it("answers 503 when Resend refuses the confirmation email", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    resend.send.mockResolvedValue({ data: null, error: { name: "application_error", message: "down", statusCode: 500 } });
    const POST = await loadRoute();
    const response = await POST(post(signup("refused@example.com")));

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(logged(error)).not.toContain("refused@example.com");
  });
});
