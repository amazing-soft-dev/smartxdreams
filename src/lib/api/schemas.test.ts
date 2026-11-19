import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors } from "@/lib/forms/contact";
import { waitlistConsent, waitlistSchema } from "@/lib/forms/waitlist";
import { contactRequestSchema, spamGuardSchema, waitlistRequestSchema } from "./schemas";
import { spamVerdict } from "./spam";

const contact = { name: "Ann Example", email: "ann@example.com", topic: "general", message: "A question for the team." };
const waitlist = { email: "ann@example.com", product: "senioraiplans", consent: true, consentVersion: waitlistConsent.version, elapsedMs: 5000 };

describe("contact form schema", () => {
  it("accepts a complete message and trims it", () => {
    const result = contactSchema.safeParse({ ...contact, name: "  Ann Example  " });
    expect(result.success && result.data.name).toBe("Ann Example");
  });

  it("reports one plain-language message per field", () => {
    const result = contactSchema.safeParse({ name: "", email: "nope", topic: "other", message: "short" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toEqual({
      name: "Enter your name.",
      email: "Enter an email address like name@example.com.",
      topic: "Choose a topic.",
      message: "Write at least 10 characters so we know how to help.",
    });
  });

  it("treats an empty product as no product", () => {
    const result = contactSchema.safeParse({ ...contact, product: "" });
    expect(result.success && result.data.product).toBeUndefined();
  });

  it("caps the message length", () => {
    expect(contactSchema.safeParse({ ...contact, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("contact request schema (server)", () => {
  it("accepts a known product and the spam-guard fields", () => {
    expect(contactRequestSchema.safeParse({ ...contact, product: "senioraiplans", website: "", elapsedMs: 4000 }).success).toBe(true);
  });

  it("rejects a product slug that does not exist", () => {
    const result = contactRequestSchema.safeParse({ ...contact, product: "nope", elapsedMs: 4000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ product: "Choose a product from the list." });
  });
});

describe("time on the form (spam guard)", () => {
  const elapsed = (elapsedMs: unknown) => spamGuardSchema.safeParse({ website: "", elapsedMs });
  const DAY_MS = 86_400_000;

  it("keeps a time within 24 hours as it is", () => {
    for (const ms of [0, 1, 4000, DAY_MS]) {
      const result = elapsed(ms);
      expect(result.success && result.data.elapsedMs).toBe(ms);
    }
  });

  it("accepts a form left open for more than 24 hours, recorded as 24 hours", () => {
    const result = elapsed(25 * 60 * 60_000);
    expect(result.success && result.data.elapsedMs).toBe(DAY_MS);
    // Such a form is a person's, not a script's.
    expect(result.success && spamVerdict(result.data)).toBeNull();

    const contactResult = contactRequestSchema.safeParse({ ...contact, website: "", elapsedMs: 30 * DAY_MS });
    expect(contactResult.success && contactResult.data.elapsedMs).toBe(DAY_MS);
    const waitlistResult = waitlistRequestSchema.safeParse({ ...waitlist, elapsedMs: 30 * DAY_MS });
    expect(waitlistResult.success && waitlistResult.data.elapsedMs).toBe(DAY_MS);
  });

  it("accepts a negative time, from a clock that moved backwards, recorded as zero", () => {
    const result = elapsed(-5000);
    expect(result.success && result.data.elapsedMs).toBe(0);
    expect(contactRequestSchema.safeParse({ ...contact, website: "", elapsedMs: -1 }).success).toBe(true);
    expect(waitlistRequestSchema.safeParse({ ...waitlist, elapsedMs: -1 }).success).toBe(true);
  });

  it("leaves a missing time missing, so the spam guard still sees that it was not sent", () => {
    const result = spamGuardSchema.safeParse({ website: "" });
    expect(result.success && result.data.elapsedMs).toBeUndefined();
    expect(result.success && spamVerdict(result.data)).toBe("no-timer");
  });

  it("still refuses a time that is not a whole number", () => {
    for (const value of ["5000", 12.5, null, true, Number.NaN, Number.POSITIVE_INFINITY, {}]) {
      expect(elapsed(value).success).toBe(false);
    }
  });
});

describe("waitlist schemas", () => {
  it("requires consent", () => {
    const result = waitlistSchema.safeParse({ email: "ann@example.com", product: "senioraiplans", consent: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ consent: "Tick the box to agree to waitlist emails." });
  });

  it("accepts each of the six products and nothing else", () => {
    for (const product of ["joined", "acorn", "sitelog", "toothledger", "senioraiplans", "trustdraft"]) {
      expect(waitlistRequestSchema.safeParse({ ...waitlist, product }).success).toBe(true);
    }
    expect(waitlistRequestSchema.safeParse({ ...waitlist, product: "nope" }).success).toBe(false);
  });

  it("accepts a renamed product's old slug and records the new one", () => {
    const result = waitlistRequestSchema.safeParse({ ...waitlist, product: "kinly" });
    expect(result.success && result.data.product).toBe("senioraiplans");
    const contactResult = contactRequestSchema.safeParse({ ...contact, product: "jobatlas", website: "", elapsedMs: 4000 });
    expect(contactResult.success && contactResult.data.product).toBe("joined");
  });

  it("asks for a reload when the consent wording has changed", () => {
    const result = waitlistRequestSchema.safeParse({ ...waitlist, consentVersion: "2000-01-01" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors<string>(result.error).consentVersion).toMatch(/Reload the page/);
  });
});
