import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SplitText } from "./SplitText";

const render = (text: string, tone?: "light" | "dark") => renderToStaticMarkup(createElement(SplitText, { text, tone }));

describe("SplitText", () => {
  it("keeps the heading's text exactly once, as the plain sentence", () => {
    const html = render("One studio, *six focused products.*");
    expect(html.replace(/<[^>]+>/g, "")).toBe("One studio, six focused products.");
    expect(html).not.toContain("aria-hidden");
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

  it("keeps punctuation that touches an accent in the same word, in the plain colour", () => {
    const stop = render("Send us a *message*.");
    expect(stop.replace(/<[^>]+>/g, "")).toBe("Send us a message.");
    expect(stop.match(/data-word=""/g)).toHaveLength(4);
    expect(stop).toContain('<span class="text-violet-500">message</span>.</span>');

    const comma = render("We do the *paperwork*, so you can decide.", "dark");
    expect(comma.replace(/<[^>]+>/g, "")).toBe("We do the paperwork, so you can decide.");
    expect(comma).toContain('<span class="text-violet-300">paperwork</span>,</span>');

    const bracket = render("One (*two*) three");
    expect(bracket.replace(/<[^>]+>/g, "")).toBe("One (two) three");
    expect(bracket.match(/data-word=""/g)).toHaveLength(3);
  });

  it("marks every word for the reduced-motion and no-JavaScript fallbacks", () => {
    const html = render("Three plain words");
    expect(html.match(/data-reveal=""/g)).toHaveLength(3);
    expect(html.match(/data-motion="rise"/g)).toHaveLength(3);
  });
});
