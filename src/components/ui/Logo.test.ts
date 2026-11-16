import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

type Props = Parameters<typeof Logo>[0];

const render = (props: Props = {}) => renderToStaticMarkup(createElement(Logo, props));

/** Every id="..." in the markup. */
const ids = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
/** Every url(#...) reference in the markup. */
const refs = (html: string) => [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

describe("Logo", () => {
  describe("mark", () => {
    it("draws the symbol cropped to its strokes", () => {
      const html = render({ variant: "mark", height: 273 });
      expect(html).toContain('viewBox="216 116 168 273"');
      expect(html).toContain('height="273"');
      expect(html).toContain('width="168"');
    });

    it("uses the light-background colours for tone dark", () => {
      const html = render({ variant: "mark", tone: "dark" });
      expect(html).toContain('stroke="#2B2170"');
      expect(html).toContain('stroke="#6E56F0"');
      expect(html).not.toContain("#A99BFF");
    });

    it("uses the dark-background colours for tone light", () => {
      const html = render({ variant: "mark", tone: "light" });
      expect(html).toContain('stroke="#A99BFF"');
      expect(html).toContain('stroke="#E6E1FF"');
      expect(html).not.toContain("#2B2170");
    });

    it("is an image named by its label, or hidden when decorative", () => {
      expect(render({ variant: "mark", label: "Home" })).toMatch(/^<svg[^>]*role="img"[^>]*aria-label="Home"/);
      const decorative = render({ variant: "mark", decorative: true });
      expect(decorative).toMatch(/^<svg[^>]*aria-hidden="true"/);
      expect(decorative).not.toContain('role="img"');
    });

    it("references only masks and clip paths it defines", () => {
      const html = render({ variant: "mark" });
      expect(new Set(refs(html))).toEqual(new Set(ids(html)));
    });
  });

  describe("full", () => {
    it("pairs the symbol with the wordmark text", () => {
      const html = render();
      expect(html).toContain('viewBox="216 116 168 273"');
      expect(html.replace(/<[^>]+>/g, "")).toBe("SmartxDreams");
    });

    it("colours the x with the accent of each tone", () => {
      expect(render({ tone: "dark" })).toContain('<span style="color:#6E56F0">x</span>');
      expect(render({ tone: "light" })).toContain('<span style="color:#A99BFF">x</span>');
    });

    it("scales the wordmark with the height", () => {
      expect(render({ height: 30 })).toContain("font-size:18px");
    });

    it("is one image: the symbol and the text inside are hidden from assistive technology", () => {
      const html = render({ label: "SmartxDreams" });
      expect(html).toMatch(/^<span[^>]*role="img"[^>]*aria-label="SmartxDreams"/);
      expect(html.match(/role="img"/g)).toHaveLength(1);
      expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    });

    it("hides everything when decorative", () => {
      const html = render({ decorative: true });
      expect(html).toMatch(/^<span[^>]*aria-hidden="true"/);
      expect(html).not.toContain("role=");
      expect(html).not.toContain("aria-label");
    });
  });

  it("gives every copy on a page its own mask and clip-path ids", () => {
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(Logo, { tone: "dark" }),
        createElement(Logo, { tone: "light" }),
        createElement(Logo, { variant: "mark", tone: "light" }),
      ),
    );
    const all = ids(html);
    expect(all).toHaveLength(12);
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(refs(html))).toEqual(new Set(all));
  });
});
