import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * POST /api/contact with a fake Resend client: no network, and every email the route would send is
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
};
const notConfigured = { RESEND_API_KEY: "", CONTACT_FROM_EMAIL: "", CONTACT_TO_EMAIL: "" };

async function loadRoute(env: Record<string, string> = configured) {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ...notConfigured, ...env })) vi.stubEnv(name, value);
  const { POST } = await import("./route.api");
  const { resetRateLimits } = await import("@/lib/api/rate-limit");
  resetRateLimits();
  return POST;
}

const message = (email: string, fields: Record<string, unknown> = {}) => ({
  name: "Zebediah Quux",
  email,
  topic: "general",
  product: "",
  message: "Purple elephants dance at midnight.",
  website: "",
  elapsedMs: 8_000,
  ...fields,
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** The first argument of every call to the fake Resend client: the emails, in the order they were sent. */
const sent = () => resend.send.mock.calls.map((call) => call[0] as { from: string; to: string; subject: string; text: string; replyTo?: string });

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

describe("POST /api/contact", () => {
  it("emails the team with the sender as Reply-To, then acknowledges the sender", async () => {
    const POST = await loadRoute();
    const response = await POST(post(message("success@example.com")));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const [notification, acknowledgement, ...more] = sent();
    expect(more).toEqual([]);
    expect(notification).toMatchObject({
      from: configured.CONTACT_FROM_EMAIL,
      to: configured.CONTACT_TO_EMAIL,
      replyTo: "success@example.com",
      subject: "[Contact] General question: Zebediah Quux",
    });
    expect(notification?.text).toContain("Purple elephants dance at midnight.");
    expect(acknowledgement).toMatchObject({ from: configured.CONTACT_FROM_EMAIL, to: "success@example.com" });
  });

  it("sends the acknowledgement without anything the sender typed", async () => {
    const POST = await loadRoute();
    await POST(post(message("acknowledged@example.com")));

    const acknowledgement = sent().find((email) => email.to === "acknowledged@example.com");
    expect(acknowledgement).toBeDefined();
    const { to, ...rest } = acknowledgement ?? { to: "" };
    expect(to).toBe("acknowledged@example.com");
    for (const typed of ["Zebediah", "Quux", "acknowledged@example.com", "Purple elephants"]) {
      expect(JSON.stringify(rest)).not.toContain(typed);
    }
  });

  it("sends the subject as one line when the name contains a line break", async () => {
    const POST = await loadRoute();
    const response = await POST(post(message("newline@example.com", { name: "Zebediah\r\nBcc: other@example.com" })));

    expect(response.status).toBe(200);
    for (const email of sent()) expect(email.subject).not.toMatch(/[\r\n]/);
    expect(sent()[0]?.subject).toBe("[Contact] General question: Zebediah Bcc: other@example.com");
  });

  it("answers 429 with Retry-After once one client has sent too many", async () => {
    const POST = await loadRoute();
    const from = { "x-forwarded-for": "198.51.100.20" };
    // Caught as spam, so nothing is sent, but every request counts towards the limit.
    for (let i = 0; i < 5; i++) expect((await POST(post(message("limited@example.com", { website: "x" }), from))).status).toBe(200);

    const response = await POST(post(message("limited@example.com"), from));
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("rate_limited");
    const retryAfter = Number(response.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(600);
    expect(sent()).toEqual([]);

    // Another visitor is not affected.
    expect((await POST(post(message("other-visitor@example.com"), { "x-forwarded-for": "198.51.100.21" }))).status).toBe(200);
  });

  it("answers 415 for a body that is not JSON by type, and 400 for one that is not JSON by content", async () => {
    const POST = await loadRoute();

    const form = await POST(post("name=Zebediah", { "Content-Type": "application/x-www-form-urlencoded" }));
    expect(form.status).toBe(415);
    expect((await form.json()).error.code).toBe("unsupported_media_type");

    const broken = await POST(post("{not json"));
    expect(broken.status).toBe(400);
    expect((await broken.json()).error.code).toBe("invalid_json");
    expect(sent()).toEqual([]);
  });

  it("answers 400 with a message for each field that needs attention", async () => {
    const POST = await loadRoute();
    const response = await POST(post(message("not-an-address", { name: "", topic: "nope", message: "short" })));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_input", message: "Some fields need attention." } });
    expect(Object.keys(body.error.fields).sort()).toEqual(["email", "message", "name", "topic"]);
    for (const text of Object.values(body.error.fields)) expect(text).toMatch(/\S/);
    expect(sent()).toEqual([]);
  });

  it("answers 400 for a product that does not exist", async () => {
    const POST = await loadRoute();
    const response = await POST(post(message("unknown-product@example.com", { product: "no-such-product" })));

    expect(response.status).toBe(400);
    expect(Object.keys((await response.json()).error.fields)).toEqual(["product"]);
    expect(sent()).toEqual([]);
  });

  it("answers 200 and sends nothing for a filled honeypot, a too-fast submit and a missing timer", async () => {
    const POST = await loadRoute();
    const bodies = [
      message("honeypot@example.com", { website: "https://spam.example" }),
      message("fast@example.com", { elapsedMs: 300 }),
      message("no-timer@example.com", { elapsedMs: undefined }),
    ];

    for (const body of bodies) {
      const response = await POST(post(body));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(sent()).toEqual([]);
  });

  it("answers 503 and sends nothing when email is not configured, without logging what was typed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const POST = await loadRoute(notConfigured);
    const response = await POST(post(message("unconfigured@example.com")));

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(sent()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    expect(logged(warn, error)).toContain("RESEND_API_KEY");
    for (const typed of ["Zebediah", "unconfigured@example.com", "Purple elephants"]) expect(logged(warn, error)).not.toContain(typed);
  });

  it("answers 503 when only the team inbox is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const POST = await loadRoute({ ...configured, CONTACT_TO_EMAIL: "" });
    const response = await POST(post(message("no-inbox@example.com")));

    expect(response.status).toBe(503);
    expect(sent()).toEqual([]);
    expect(logged(warn)).toContain("CONTACT_TO_EMAIL");
  });

  it("answers 503 when Resend refuses the notification, and does not acknowledge", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    resend.send.mockResolvedValue({ data: null, error: { name: "application_error", message: "down", statusCode: 500 } });
    const POST = await loadRoute();
    const response = await POST(post(message("refused@example.com")));

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(sent().map((email) => email.to)).toEqual([configured.CONTACT_TO_EMAIL]);
    for (const typed of ["Zebediah", "refused@example.com", "Purple elephants"]) expect(logged(error)).not.toContain(typed);
  });

  it("still answers 200 when only the acknowledgement fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resend.send.mockResolvedValueOnce({ data: { id: "email-id" }, error: null }).mockRejectedValueOnce(new TypeError("fetch failed"));
    const POST = await loadRoute();
    const response = await POST(post(message("unacknowledged@example.com")));

    expect(response.status).toBe(200);
    expect(sent().map((email) => email.to)).toEqual([configured.CONTACT_TO_EMAIL, "unacknowledged@example.com"]);
  });
});
