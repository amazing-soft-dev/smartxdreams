import { describe, expect, it } from "vitest";
import { closestPath } from "./closest-path";

const known = ["/", "/about", "/products", "/products/kinly", "/products/sitelog", "/blog/reading-a-dental-quote"];

describe("closestPath", () => {
  it("suggests the page a typo was aiming for", () => {
    expect(closestPath("/prodcts/kinly", known)).toBe("/products/kinly");
    expect(closestPath("/abuot", known)).toBe("/about");
    expect(closestPath("/blog/reading-a-dentl-quote", known)).toBe("/blog/reading-a-dental-quote");
  });

  it("does not suggest the page itself or guess for unrelated addresses", () => {
    expect(closestPath("/Products/Kinly/", known)).toBeUndefined();
    expect(closestPath("/totally-unrelated-thing", known)).toBeUndefined();
  });
});
