import { describe, expect, it } from "vitest";
import { MIN_FILL_MS, spamVerdict } from "./spam";

describe("spamVerdict", () => {
  it("passes a person who took a few seconds", () => {
    expect(spamVerdict({ website: "", elapsedMs: MIN_FILL_MS + 1 })).toBeNull();
  });

  it("flags a filled honeypot, a too-fast submit and a missing timer", () => {
    expect(spamVerdict({ website: "http://spam.example", elapsedMs: 10_000 })).toBe("honeypot");
    expect(spamVerdict({ website: "", elapsedMs: 200 })).toBe("too-fast");
    expect(spamVerdict({ website: "" })).toBe("no-timer");
  });

  it("ignores a honeypot that only holds whitespace", () => {
    expect(spamVerdict({ website: "   ", elapsedMs: 10_000 })).toBeNull();
  });
});
