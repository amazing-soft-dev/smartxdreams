import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SplitText } from "./SplitText";

const render = (text: string, tone?: "light" | "dark") => renderToStaticMarkup(createElement(SplitText, { text, tone }));

describe("SplitText", () => {
  it("gives screen readers the plain heading once and hides the split words", () => {
    const html = render("One studio, *six focused products.*");
    expect(html).toContain('<span class="sr-only">One studio, six focused products.</span>');
    expect(html).toMatch(/<span aria-hidden="true">/);
  });

  it("splits into one word per span, each starting 75 px low and almost transparent", () => {
    const html = render("One studio, *six focused products.*");
    const words = [...html.matchAll(/<span data-word=""[^>]*>([^<]+)<\/span>/g)].map((m) => m[1]);
    expect(words).toEqual(["One", "studio,", "six", "focused", "products."]);
    expect(html.match(/opacity:0\.001;transform:translateY\(75px\)/g)).toHaveLength(5);
  });

  it("colours the accent words for the surface", () => {
    expect(render("A *b* c")).toMatch(/class="inline-block text-violet-500"[^>]*>b</);
    expect(render("A *b* c", "dark")).toMatch(/class="inline-block text-violet-300"[^>]*>b</);
  });

  it("marks every word for the reduced-motion and no-JavaScript fallbacks", () => {
    const html = render("Three plain words");
    expect(html.match(/data-reveal=""/g)).toHaveLength(3);
    expect(html.match(/data-motion="rise"/g)).toHaveLength(3);
  });
});
