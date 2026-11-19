import { describe, expect, it } from "vitest";
import { reportableUrl } from "./analytics-url";

describe("reportableUrl", () => {
  it("reports the confirm page without its fragment", () => {
    expect(reportableUrl("https://www.example.com/waitlist/confirm#token=abc.def")).toBe("https://www.example.com/waitlist/confirm");
  });

  it("reports the confirm page without its query string", () => {
    expect(reportableUrl("https://www.example.com/waitlist/confirm?token=abc.def")).toBe("https://www.example.com/waitlist/confirm");
  });

  it("drops both when a link has a query string and a fragment", () => {
    expect(reportableUrl("https://www.example.com/waitlist/confirm/?utm=x#token=abc.def")).toBe("https://www.example.com/waitlist/confirm/");
  });

  it("leaves other pages unchanged, filters and in-page links included", () => {
    for (const url of [
      "https://www.example.com/",
      "https://www.example.com/products?audience=work",
      "https://www.example.com/products/joined#waitlist",
      "https://www.example.com/waitlist",
    ]) {
      expect(reportableUrl(url)).toBe(url);
    }
  });

  it("never passes on the query string or fragment of an address it cannot parse", () => {
    expect(reportableUrl("/waitlist/confirm#token=abc.def")).toBe("/waitlist/confirm");
    expect(reportableUrl("not a url?token=abc")).toBe("not a url");
  });
});
