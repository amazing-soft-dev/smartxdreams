import { describe, expect, it } from "vitest";
import { confirmationEmail } from "@/lib/api/waitlist-emails";
import { tokenFromLocation } from "./waitlist-link";

const token = "eyJlIjoiYW5uQGV4YW1wbGUuY29tIn0.c2lnbmF0dXJl-_0";

describe("the token in a waitlist confirmation link", () => {
  it("is read from the fragment", () => {
    expect(tokenFromLocation(`#token=${token}`, "")).toBe(token);
  });

  it("is read from the query string of a link emailed before the token moved", () => {
    expect(tokenFromLocation("", `?token=${token}`)).toBe(token);
    expect(tokenFromLocation("", `?utm_source=mail&token=${token}`)).toBe(token);
    // useSearchParams().toString() has no leading "?".
    expect(tokenFromLocation("", `token=${token}`)).toBe(token);
  });

  it("comes from the fragment when both are present", () => {
    expect(tokenFromLocation(`#token=${token}`, "?token=another.token")).toBe(token);
  });

  it("falls back to the query string when the fragment has no token", () => {
    expect(tokenFromLocation("#main", `?token=${token}`)).toBe(token);
    expect(tokenFromLocation("#token=", `?token=${token}`)).toBe(token);
  });

  it("is null when neither has one", () => {
    expect(tokenFromLocation("", "")).toBeNull();
    expect(tokenFromLocation("#", "?")).toBeNull();
    expect(tokenFromLocation("#main", "?product=sitelog")).toBeNull();
    expect(tokenFromLocation("#token=", "?token=")).toBeNull();
  });

  it("is decoded when it arrives percent-encoded", () => {
    const encoded = token.replace(".", "%2E").replace("-", "%2D").replace("_", "%5F");
    expect(encoded).not.toBe(token);
    expect(tokenFromLocation(`#token=${encoded}`, "")).toBe(token);
    expect(tokenFromLocation("", `?token=${encoded}`)).toBe(token);
  });
});

describe("the link in the confirmation email", () => {
  it("carries the token in the fragment, where the confirm page reads it back", () => {
    const { text } = confirmationEmail({ product: "sitelog", token });
    const link = new URL(text.split("\n").find((line) => line.includes("/waitlist/confirm")) ?? "");
    expect(link.pathname).toBe("/waitlist/confirm");
    expect(link.search).toBe("");
    expect(link.hash).toBe(`#token=${token}`);
    expect(tokenFromLocation(link.hash, link.search)).toBe(token);
  });
});
