import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postContact } from "@/app/api/contact/route.api";
import { POST as postWaitlist } from "@/app/api/waitlist/route.api";
import { waitlistConsent } from "@/lib/forms/waitlist";
import { type SendResult, sendEmail } from "./email";
import { resetRateLimits } from "./rate-limit";
import { firstAcknowledgement, forgetAcknowledgement, forgetSignupEmail, mayEmailSignup, recordSignupEmail } from "./waitlist-dedupe";

// The routes run for real against a stand-in for Resend that only records what would have been sent.
vi.mock("./email", () => ({
  emailTransport: () => ({ resend: {}, from: "Team <team@example.com>", teamInbox: "inbox@example.com" }),
  sendEmail: vi.fn(),
}));
vi.mock("./waitlist-config", () => ({ waitlistConfig: () => ({ secret: "test-secret-that-is-at-least-32-characters" }) }));

const send = vi.mocked(sendEmail);
const sent: SendResult = { ok: true };
const failed: SendResult = { ok: false, reason: "send-failed" };
const sentWithPurpose = (purpose: string) => send.mock.calls.filter(([message]) => message.purpose === purpose);

const DAY_MS = 24 * 60 * 60_000;

/** A form post. Every request comes from its own IP, so only the per-address limits are at work. */
let requests = 0;
const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `203.0.113.${++requests}` },
    body: JSON.stringify(body),
  });
const contactMessage = (email: string) =>
  post("/api/contact", { name: "Ann", email, topic: "general", message: "A question about your products.", elapsedMs: 5_000 });
const signUp = (email: string) =>
  post("/api/waitlist", { email, product: "sitelog", consent: true, consentVersion: waitlistConsent.version, elapsedMs: 5_000 });

beforeEach(() => {
  resetRateLimits();
  send.mockReset();
  send.mockResolvedValue(sent);
});

describe("contact acknowledgements", () => {
  it("go to an address once in 24 hours, however it is typed", () => {
    const t = 7_000_000;
    expect(firstAcknowledgement("ack@example.com", t)).toBe(true);
    expect(firstAcknowledgement("ack@example.com", t + 1)).toBe(false);
    expect(firstAcknowledgement(" ACK@Example.com ", t + 2)).toBe(false);
    expect(firstAcknowledgement("other@example.com", t + 2)).toBe(true);
    expect(firstAcknowledgement("ack@example.com", t + DAY_MS - 1)).toBe(false);
    expect(firstAcknowledgement("ack@example.com", t + DAY_MS)).toBe(true);
  });

  it("are not counted when the send failed", () => {
    expect(firstAcknowledgement("undo@example.com")).toBe(true);
    forgetAcknowledgement("UNDO@example.com");
    expect(firstAcknowledgement("undo@example.com")).toBe(true);
    expect(firstAcknowledgement("undo@example.com")).toBe(false);
  });

  it("five messages with one reply address reach the team five times and are acknowledged once", async () => {
    const statuses: number[] = [];
    for (const email of ["five@example.com", "five@example.com", "Five@Example.com", "five@example.com", "FIVE@EXAMPLE.COM"]) {
      statuses.push((await postContact(contactMessage(email))).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200]);
    expect(sentWithPurpose("contact-notification")).toHaveLength(5);
    expect(sentWithPurpose("contact-acknowledgement")).toHaveLength(1);
  });

  it("five messages arriving together are acknowledged once", async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => postContact(contactMessage("together@example.com"))));
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(sentWithPurpose("contact-notification")).toHaveLength(5);
    expect(sentWithPurpose("contact-acknowledgement")).toHaveLength(1);
  });

  it("a failed acknowledgement still answers 200 and leaves the next message its acknowledgement", async () => {
    send.mockImplementation(async ({ purpose }) => (purpose === "contact-acknowledgement" ? failed : sent));
    expect((await postContact(contactMessage("retry@example.com"))).status).toBe(200);
    send.mockResolvedValue(sent);
    expect((await postContact(contactMessage("retry@example.com"))).status).toBe(200);
    expect((await postContact(contactMessage("retry@example.com"))).status).toBe(200);
    // One failed attempt, one delivered, and nothing for the third message.
    expect(sentWithPurpose("contact-acknowledgement")).toHaveLength(2);
    expect(sentWithPurpose("contact-notification")).toHaveLength(3);
  });
});

describe("waitlist confirmation emails", () => {
  it("are counted before they are sent, and uncounted when the send failed", () => {
    const t = 8_000_000;
    recordSignupEmail("count@example.com", "sitelog", t);
    recordSignupEmail("count@example.com", "sitelog", t);
    expect(mayEmailSignup("count@example.com", "sitelog", t + 1)).toBe(false);
    forgetSignupEmail("COUNT@example.com", "sitelog", t);
    expect(mayEmailSignup("count@example.com", "sitelog", t + 1)).toBe(true);
    // Only the email that failed is uncounted: another product, or a time that was never counted, changes nothing.
    recordSignupEmail("count@example.com", "sitelog", t + 1);
    forgetSignupEmail("count@example.com", "joined", t);
    forgetSignupEmail("count@example.com", "sitelog", t + 5);
    expect(mayEmailSignup("count@example.com", "sitelog", t + 2)).toBe(false);
  });

  it("five sign-ups for one address arriving together send two emails", async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => postWaitlist(signUp("rush@example.com"))));
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(sentWithPurpose("waitlist-confirmation")).toHaveLength(2);
    // The rest of the day's attempts get the same answer and no email.
    expect((await postWaitlist(signUp("rush@example.com"))).status).toBe(200);
    expect(sentWithPurpose("waitlist-confirmation")).toHaveLength(2);
  });

  it("a failed send answers 503 and never blocks a retry", async () => {
    send.mockResolvedValue(failed);
    for (let attempt = 0; attempt < 3; attempt++) expect((await postWaitlist(signUp("down@example.com"))).status).toBe(503);
    expect(sentWithPurpose("waitlist-confirmation")).toHaveLength(3);
    send.mockResolvedValue(sent);
    expect((await postWaitlist(signUp("down@example.com"))).status).toBe(200);
    expect((await postWaitlist(signUp("down@example.com"))).status).toBe(200);
    expect((await postWaitlist(signUp("down@example.com"))).status).toBe(200);
    // Three failed attempts, then the day's two; the last request is answered without an email.
    expect(sentWithPurpose("waitlist-confirmation")).toHaveLength(5);
  });

  it("sign-ups arriving together while email is down do not use up the day's two", async () => {
    send.mockResolvedValue(failed);
    const responses = await Promise.all(Array.from({ length: 2 }, () => postWaitlist(signUp("later@example.com"))));
    expect(responses.map((r) => r.status)).toEqual([503, 503]);
    expect(mayEmailSignup("later@example.com", "sitelog")).toBe(true);
    send.mockResolvedValue(sent);
    expect((await postWaitlist(signUp("later@example.com"))).status).toBe(200);
    expect((await postWaitlist(signUp("later@example.com"))).status).toBe(200);
    expect(sentWithPurpose("waitlist-confirmation")).toHaveLength(4);
  });
});
