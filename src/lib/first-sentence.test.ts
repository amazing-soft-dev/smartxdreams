import { describe, expect, it } from "vitest";
import { products } from "@/content/products";
import { firstSentence } from "./first-sentence";

describe("firstSentence", () => {
  it("cuts after the first full stop that ends a sentence", () => {
    expect(firstSentence("Upload a quote. Get an estimate.")).toBe("Upload a quote.");
  });

  it("returns a one-sentence text as it is, without a second full stop", () => {
    expect(firstSentence("One search for every job board.")).toBe("One search for every job board.");
  });

  it("does not stop at a full stop inside a number", () => {
    expect(firstSentence("Policy 4.2 covers it. See the source.")).toBe("Policy 4.2 covers it.");
  });

  it("ends every product summary with exactly one full stop", () => {
    for (const product of products) {
      expect(firstSentence(product.summary)).toMatch(/[^.]\.$/);
    }
  });
});
