import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitlistConsent } from "@/lib/forms/waitlist";

/**
 * env.ts reads process.env when it is imported and caches the server settings, so every test sets the
 * variables first and then loads a fresh copy of the modules. Resend is replaced by a fake that records
 * what would have been sent.
 */

const resend = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
  },
}));

const shortSecret = "tencharsxx";
const namedInbox = "Team <team@example.com>";
const valid = {
  RESEND_API_KEY: "re_test_key",
  CONTACT_FROM_EMAIL: "SmartxDreams <hello@example.com>",
  CONTACT_TO_EMAIL: "team@example.com",
  WAITLIST_SECRET: "a-test-secret-of-at-least-32-characters",
};
/** Every variable env.ts reads, empty: the same as unset, whatever the machine running the tests has. */
const unset = {
  NEXT_PUBLIC_SITE_URL: "",
  RESEND_API_KEY: "",
  CONTACT_FROM_EMAIL: "",
  CONTACT_TO_EMAIL: "",
  WAITLIST_SECRET: "",
  RESEND_WAITLIST_SEGMENT_ID: "",
  VERCEL_ENV: "",
};

/** Sets the environment for one test. Import the modules under test after calling it. */
function setEnv(env: Record<string, string>) {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ...unset, ...env })) vi.stubEnv(name, value);
}

async function loadEnv(env: Record<string, string>) {
  setEnv(env);
  return import("./env");
}

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const contactBody = { name: "Ann Example", email: "ann@example.com", topic: "general", message: "A question for the team.", website: "", elapsedMs: 8_000 };
const waitlistBody = { email: "ann@example.com", product: "sitelog", consent: true, consentVersion: waitlistConsent.version, website: "", elapsedMs: 8_000 };

/** Everything written to console.warn, as one string. */
const warnings = (warn: { mock: { calls: unknown[][] } }) => warn.mock.calls.flat().join("\n");

beforeEach(() => {
  resend.send.mockReset();
  resend.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server settings", () => {
  it("are all optional, and returned when valid", async () => {
    const nothing = await loadEnv({});
    expect(nothing.readServerEnv()).toEqual({ env: {} });
    expect(nothing.serverEnv()).toEqual({});

    const everything = await loadEnv(valid);
    expect(everything.readServerEnv()).toEqual({ env: valid });
    expect(everything.serverEnv()).toEqual(valid);
  });

  it("name a secret that is too short, without its value", async () => {
    const env = await loadEnv({ ...valid, WAITLIST_SECRET: shortSecret });
    const result = env.readServerEnv();
    expect("invalid" in result && result.invalid).toMatch(/^WAITLIST_SECRET: .*32 characters/);
    expect(JSON.stringify(result)).not.toContain(shortSecret);
    expect(() => env.serverEnv()).toThrow(/Invalid server environment variables: WAITLIST_SECRET/);
  });

  it("name an inbox that is not a plain address, without its value", async () => {
    const env = await loadEnv({ ...valid, CONTACT_TO_EMAIL: namedInbox });
    const result = env.readServerEnv();
    expect("invalid" in result && result.invalid).toMatch(/^CONTACT_TO_EMAIL: /);
    expect(JSON.stringify(result)).not.toContain("team@example.com");
    expect(() => env.serverEnv()).toThrow(/CONTACT_TO_EMAIL/);
  });

  it("name every invalid setting at once", async () => {
    const env = await loadEnv({ ...valid, WAITLIST_SECRET: shortSecret, CONTACT_TO_EMAIL: namedInbox });
    const result = env.readServerEnv();
    expect("invalid" in result && result.invalid).toMatch(/CONTACT_TO_EMAIL: .*; WAITLIST_SECRET: /);
  });
});

describe("production build check", () => {
  const production = { VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://www.example.com" };

  it("passes with an https site URL, with or without the email settings", async () => {
    for (const settings of [production, { ...production, ...valid }]) {
      const env = await loadEnv(settings);
      expect(() => env.assertProductionEnv()).not.toThrow();
      expect(env.publicEnv.NEXT_PUBLIC_SITE_URL).toBe("https://www.example.com");
    }
  });

  it("fails without a site URL instead of falling back to localhost", async () => {
    const env = await loadEnv({ ...production, NEXT_PUBLIC_SITE_URL: "" });
    expect(env.publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(() => env.assertProductionEnv()).toThrow(/production deployment: NEXT_PUBLIC_SITE_URL: not set/);
  });

  it("fails for a site URL that is not https", async () => {
    for (const url of ["http://www.example.com", "http://localhost:3000"]) {
      const env = await loadEnv({ ...production, NEXT_PUBLIC_SITE_URL: url });
      expect(() => env.assertProductionEnv()).toThrow(/NEXT_PUBLIC_SITE_URL: must be an https URL/);
    }
  });

  it("fails for invalid server settings, naming each without its value", async () => {
    const env = await loadEnv({ ...production, ...valid, WAITLIST_SECRET: shortSecret, CONTACT_TO_EMAIL: namedInbox });
    let message = "";
    try {
      env.assertProductionEnv();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("WAITLIST_SECRET: WAITLIST_SECRET must be at least 32 characters");
    expect(message).toContain("CONTACT_TO_EMAIL: ");
    expect(message).not.toContain("NEXT_PUBLIC_SITE_URL");
    expect(message).not.toContain(shortSecret);
    expect(message).not.toContain("team@example.com");
  });

  it("reports the site URL and the server settings together", async () => {
    const env = await loadEnv({ VERCEL_ENV: "production", WAITLIST_SECRET: shortSecret });
    expect(() => env.assertProductionEnv()).toThrow(/NEXT_PUBLIC_SITE_URL: not set.*; WAITLIST_SECRET: /);
  });

  it("checks nothing on local builds, CI and preview deployments", async () => {
    for (const where of ["", "preview", "development"]) {
      const env = await loadEnv({ VERCEL_ENV: where, WAITLIST_SECRET: shortSecret, CONTACT_TO_EMAIL: namedInbox });
      expect(() => env.assertProductionEnv()).not.toThrow();
      expect(env.publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    }
  });
});

describe("invalid settings at request time", () => {
  const invalid = [
    ["a short secret", { ...valid, WAITLIST_SECRET: shortSecret }, "WAITLIST_SECRET", shortSecret],
    ["an inbox with a display name", { ...valid, CONTACT_TO_EMAIL: namedInbox }, "CONTACT_TO_EMAIL", "team@example.com"],
  ] as const;

  it.each(invalid)("count as not configured: %s", async (_what, env, name, value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv(env);
    const { emailTransport } = await import("./api/email");
    const { waitlistConfig } = await import("./api/waitlist-config");

    expect(emailTransport()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(waitlistConfig()).toBeNull();
    // One warning each, naming the setting and never its value.
    expect(warn).toHaveBeenCalledTimes(2);
    for (const [line] of warn.mock.calls) expect(line).toContain(`invalid settings: ${name}: `);
    expect(warnings(warn)).not.toContain(value);
  });

  it.each(invalid)("make every form route answer 503, not 500: %s", async (_what, env) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv(env);
    const contact = await import("@/app/api/contact/route.api");
    const waitlist = await import("@/app/api/waitlist/route.api");
    const confirm = await import("@/app/api/waitlist/confirm/route.api");

    const responses = [
      await contact.POST(post("/api/contact", contactBody)),
      await waitlist.POST(post("/api/waitlist", waitlistBody)),
      await confirm.POST(post("/api/waitlist/confirm", { token: "a-token-of-some-length" })),
    ];
    for (const response of responses) {
      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe("email_unavailable");
    }
    expect(resend.send).not.toHaveBeenCalled();
  });
});

describe("waitlist without the team inbox", () => {
  it("is not configured, and the warning names the inbox", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ ...valid, CONTACT_TO_EMAIL: "" });
    const { waitlistConfig } = await import("./api/waitlist-config");

    expect(waitlistConfig()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warnings(warn)).toBe("[waitlist] not configured: set CONTACT_TO_EMAIL");
  });

  it("answers 503 at sign-up and sends no confirmation email", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ ...valid, CONTACT_TO_EMAIL: "" });
    const { POST } = await import("@/app/api/waitlist/route.api");

    const response = await POST(post("/api/waitlist", waitlistBody));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("email_unavailable");
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("is configured once every setting is there", async () => {
    setEnv(valid);
    const { waitlistConfig } = await import("./api/waitlist-config");
    expect(waitlistConfig()).toEqual({ secret: valid.WAITLIST_SECRET });

    const { POST } = await import("@/app/api/waitlist/route.api");
    expect((await POST(post("/api/waitlist", waitlistBody))).status).toBe(200);
    expect(resend.send).toHaveBeenCalledTimes(1);
  });
});
