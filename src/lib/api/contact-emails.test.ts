import { describe, expect, it } from "vitest";
import { productBySlug } from "@/content/selectors";
import { senderAcknowledgement, teamNotification } from "./contact-emails";
import { contactRequestSchema } from "./schemas";

/** A request as the route passes it on: parsed by the same schema. The words are easy to search for. */
const request = (fields: Record<string, unknown> = {}) =>
  contactRequestSchema.parse({
    name: "Zebediah Quux",
    email: "zebediah@example.com",
    topic: "partnership",
    product: "joined",
    message: "Purple elephants dance at midnight.\nSecond line of the message.",
    website: "",
    elapsedMs: 5000,
    ...fields,
  });

const receivedAt = new Date("2026-11-18T09:30:00.000Z");
const joined = productBySlug("joined")?.name ?? "";
/** The Unicode line separator, which mail software may also treat as a line break. */
const lineSeparator = String.fromCharCode(0x2028);

describe("team notification", () => {
  it("carries every field, the time received and the sender as Reply-To", () => {
    const email = teamNotification(request(), receivedAt);
    expect(email.subject).toBe("[Contact] Partnership: Zebediah Quux");
    expect(email.replyTo).toBe("zebediah@example.com");
    for (const part of ["Zebediah Quux", "zebediah@example.com", "Partnership", joined, "2026-11-18T09:30:00.000Z"]) {
      expect(email.text).toContain(part);
    }
    expect(email.text).toContain("Purple elephants dance at midnight.\nSecond line of the message.");
  });

  it("keeps the subject on one line when the name contains line breaks", () => {
    const names = ["Zebediah\nBcc: other@example.com", "Zebediah\r\nBcc: other@example.com", `Zebediah${lineSeparator}Bcc: other@example.com`];
    for (const name of names) {
      const email = teamNotification(request({ name }), receivedAt);
      // No white space but plain spaces: no line feed, carriage return, tab or Unicode line separator.
      expect(email.subject).not.toMatch(/[^\S ]/);
      expect(email.subject).toBe("[Contact] Partnership: Zebediah Bcc: other@example.com");
      // The name is one line of the body too: nothing after a line break starts a line of its own.
      expect(email.text.split(/\r\n|[\r\n]/).some((line) => line.startsWith("Bcc:"))).toBe(false);
      expect(email.text).toContain("Zebediah Bcc: other@example.com");
    }
  });

  it("keeps a long name from filling the subject", () => {
    const email = teamNotification(request({ name: "Z".repeat(100) }), receivedAt);
    expect(email.subject.length).toBeLessThan(100);
  });

  it("says when the message is not about one product", () => {
    const withProduct = teamNotification(request(), receivedAt).text;
    const without = teamNotification(request({ product: "" }), receivedAt).text;
    expect(joined).not.toBe("");
    expect(withProduct).toContain(joined);
    expect(without).not.toContain(joined);
  });
});

describe("sender acknowledgement", () => {
  it("contains nothing the sender typed", () => {
    const email = senderAcknowledgement(request());
    const everything = JSON.stringify(email);
    for (const typed of ["Zebediah", "Quux", "zebediah@example.com", "Purple elephants", "Second line"]) {
      expect(everything).not.toContain(typed);
    }
  });

  it("is the same for any two senders who chose the same topic and product", () => {
    const other = request({ name: "Someone Else", email: "someone.else@example.com", message: "A different message entirely." });
    expect(senderAcknowledgement(other)).toEqual(senderAcknowledgement(request()));
  });

  it("names the topic and product, which come from fixed lists", () => {
    const email = senderAcknowledgement(request());
    expect(email.text).toContain("Partnership");
    expect(email.text).toContain(joined);
    expect(email.subject).not.toMatch(/[^\S ]/);
  });
});
