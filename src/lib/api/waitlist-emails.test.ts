import { describe, expect, it } from "vitest";
import { productBySlug } from "@/content/selectors";
import { waitlistConsent } from "@/lib/forms/waitlist";
import { siteUrl } from "@/lib/seo";
import { confirmationEmail, consentRecordEmail } from "./waitlist-emails";
import { TOKEN_TTL_MS, type WaitlistTokenPayload } from "./waitlist-token";

const sitelog = productBySlug("sitelog")?.name ?? "";

/** The confirmation link in an email body, and the token it carries (as a query or a fragment). */
function confirmationLink(text: string): { url: URL; token: string | null } {
  const link = /https?:\/\/\S+\/waitlist\/confirm\S*/.exec(text)?.[0] ?? "";
  const url = new URL(link);
  return { url, token: url.searchParams.get("token") ?? new URLSearchParams(url.hash.slice(1)).get("token") };
}

describe("confirmation email", () => {
  const token = "eyJlIjoiYW5uQGV4YW1wbGUuY29tIn0.c2lnbmF0dXJlLW9mLXRoZS10b2tlbg";

  it("links to the confirm page on the site with the token", () => {
    const email = confirmationEmail({ product: "sitelog", token });
    const { url, token: carried } = confirmationLink(email.text);
    expect(url.origin).toBe(new URL(siteUrl).origin);
    expect(url.pathname).toBe("/waitlist/confirm");
    expect(carried).toBe(token);
  });

  it("names the product and says how long the link works", () => {
    const email = confirmationEmail({ product: "sitelog", token });
    expect(sitelog).not.toBe("");
    expect(email.subject).toContain(sitelog);
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.text).toContain(sitelog);
    expect(email.text).toContain(`${TOKEN_TTL_MS / 86_400_000} days`);
  });
});

describe("consent record email", () => {
  const payload: WaitlistTokenPayload = {
    e: "ann@example.com",
    p: "sitelog",
    cv: waitlistConsent.version,
    ca: "2026-11-18T09:30:00.000Z",
    exp: Date.parse("2026-11-25T09:30:00.000Z"),
  };
  const confirmedAt = new Date("2026-11-19T07:00:00.000Z");

  it("records who agreed to what and when", () => {
    const email = consentRecordEmail(payload, confirmedAt);
    expect(email.subject).toBe(`[Waitlist] Confirmed: ${sitelog}`);
    for (const part of ["ann@example.com", "sitelog", waitlistConsent.version, waitlistConsent.text, payload.ca, "2026-11-19T07:00:00.000Z"]) {
      expect(email.text).toContain(part);
    }
  });

  it("does not claim the current wording for an earlier consent version", () => {
    const email = consentRecordEmail({ ...payload, cv: "2020-01-01" }, confirmedAt);
    expect(email.text).toContain("2020-01-01");
    expect(email.text).not.toContain(waitlistConsent.text);
  });
});
