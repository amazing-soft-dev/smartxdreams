import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * sendEmail() and the waitlist contact sync with a fake Resend client. The fake behaves like the real one
 * where it matters here: a request that gets no answer ends only when its abort signal fires.
 */

const resend = vi.hoisted(() => ({ send: vi.fn(), createContact: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
    contacts = { create: resend.createContact };
  },
}));

type RequestOptions = { signal?: AbortSignal } | undefined;

/** A request that never gets an answer. Like fetch, it rejects with the signal's reason when aborted. */
const stalled = (_payload: unknown, options: RequestOptions) =>
  new Promise<never>((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(options.signal?.reason));
  });

/** The same, as the Resend client reports it: it catches the failed fetch and returns an error object. */
const stalledAsResendReportsIt = (payload: unknown, options: RequestOptions) =>
  stalled(payload, options).catch(() => ({ data: null, error: { name: "application_error", message: "Unable to fetch data.", statusCode: null } }));

const message = { to: "ann@example.com", subject: "Hello", text: "A message.", purpose: "test-message" };

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  const settings = { RESEND_API_KEY: "re_test_key", CONTACT_FROM_EMAIL: "SmartxDreams <hello@example.com>", CONTACT_TO_EMAIL: "team@example.com", RESEND_WAITLIST_SEGMENT_ID: "", ...env };
  for (const [name, value] of Object.entries(settings)) vi.stubEnv(name, value);
  const email = await import("./email");
  const { recordConfirmation } = await import("./waitlist-record");
  return { ...email, recordConfirmation };
}

beforeEach(() => {
  resend.send.mockReset();
  resend.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
  resend.createContact.mockReset();
  resend.createContact.mockResolvedValue({ data: { id: "contact-id" }, error: null });
  // AbortSignal.timeout() runs on a timer of its own that fake timers cannot advance, so stand in a signal
  // driven by setTimeout, which they can.
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("The operation timed out.", "TimeoutError")), ms);
    return controller.signal;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("sendEmail", () => {
  it("sends through Resend with the configured sender", async () => {
    const { sendEmail } = await load();
    expect(await sendEmail({ ...message, replyTo: "reply@example.com" })).toEqual({ ok: true });

    expect(resend.send).toHaveBeenCalledTimes(1);
    expect(resend.send.mock.calls[0]?.[0]).toMatchObject({
      from: "SmartxDreams <hello@example.com>",
      to: "ann@example.com",
      subject: "Hello",
      text: "A message.",
      replyTo: "reply@example.com",
    });
  });

  it("gives each request a signal that aborts after the timeout", async () => {
    const { sendEmail, RESEND_TIMEOUT_MS } = await load();
    await sendEmail(message);

    expect(RESEND_TIMEOUT_MS).toBe(8_000);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(RESEND_TIMEOUT_MS);
    const signal = (resend.send.mock.calls[0]?.[1] as RequestOptions)?.signal;
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(RESEND_TIMEOUT_MS);
    expect(signal?.aborted).toBe(true);
  });

  it.each([
    ["rejects", stalled],
    ["is reported by the Resend client", stalledAsResendReportsIt],
  ])("resolves a send that never answers as send-failed once the timeout passes (the abort %s)", async (_how, never) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    resend.send.mockImplementation(never);
    const { sendEmail, RESEND_TIMEOUT_MS } = await load();

    let result: unknown = "pending";
    const sending = sendEmail(message).then((value) => (result = value));
    await vi.advanceTimersByTimeAsync(RESEND_TIMEOUT_MS - 1);
    expect(result).toBe("pending");

    await vi.advanceTimersByTimeAsync(1);
    await sending;
    expect(result).toEqual({ ok: false, reason: "send-failed" });
    // The log names the purpose and the kind of error, never the address or the text.
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain("test-message");
    expect(String(error.mock.calls[0]?.[0])).not.toContain("ann@example.com");
  });

  it("says not-configured, and calls nothing, without the Resend settings", async () => {
    const { sendEmail } = await load({ RESEND_API_KEY: "" });
    expect(await sendEmail(message)).toEqual({ ok: false, reason: "not-configured" });
    expect(resend.send).not.toHaveBeenCalled();
  });
});

describe("waitlist contact sync", () => {
  const payload = { e: "ann@example.com", p: "sitelog", cv: "2026-11-15", ca: "2026-11-18T09:30:00.000Z", exp: Date.parse("2026-11-25T09:30:00.000Z") };

  it("gives up on a stalled sync after the timeout and keeps the confirmation", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resend.createContact.mockImplementation(stalledAsResendReportsIt);
    const { recordConfirmation, RESEND_TIMEOUT_MS } = await load({ RESEND_WAITLIST_SEGMENT_ID: "seg_test" });

    let result: unknown = "pending";
    const recording = recordConfirmation(payload).then((value) => (result = value));
    await vi.advanceTimersByTimeAsync(RESEND_TIMEOUT_MS - 1);
    expect(result).toBe("pending");
    expect(resend.createContact.mock.calls[0]?.[0]).toMatchObject({ email: "ann@example.com", segments: [{ id: "seg_test" }] });

    await vi.advanceTimersByTimeAsync(1);
    await recording;
    expect(result).toEqual({ ok: true });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("ann@example.com");
  });
});
