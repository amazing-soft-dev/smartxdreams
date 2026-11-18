import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

type Props = Parameters<typeof Logo>[0];

/** Markup without the <link rel="preload"> hints React hoists for eager images. */
const render = (props: Props = {}) =>
  renderToStaticMarkup(createElement(Logo, props)).replace(/<link rel="preload"[^>]*\/>/g, "");

describe("Logo", () => {
  describe("mark", () => {
    it("uses the charcoal ribbon for tone dark and the white one for tone light", () => {
      expect(render({ variant: "mark", tone: "dark" })).toContain("/brand/logo/smartxdreams-mark-on-light-");
      expect(render({ variant: "mark", tone: "dark" })).not.toContain("mark-on-dark");
      expect(render({ variant: "mark", tone: "light" })).toContain("/brand/logo/smartxdreams-mark-on-dark-");
      expect(render({ variant: "mark", tone: "light" })).not.toContain("mark-on-light");
    });

    it("reserves its box: width and height follow the artwork's aspect ratio", () => {
      const html = render({ variant: "mark", tone: "dark", height: 26 });
      expect(html).toMatch(/height="26"/);
      expect(html).toMatch(/width="30"/);
      expect(html).toMatch(/sizes="30px"/);
    });

    it("is an image named by its label, or hidden when decorative", () => {
      expect(render({ variant: "mark", label: "Home" })).toMatch(/^<img[^>]*alt="Home"/);
      const decorative = render({ variant: "mark", decorative: true });
      expect(decorative).toMatch(/^<img[^>]*alt=""/);
      expect(decorative).toMatch(/aria-hidden="true"/);
    });
  });

  describe("full", () => {
    it("pairs the ribbon with the wordmark text", () => {
      const html = render();
      expect(html).toContain("<img");
      expect(html.replace(/<[^>]+>/g, "")).toBe("SmartxDreams");
    });

    it("colours the x with the accent of each tone", () => {
      expect(render({ tone: "dark" })).toContain('<span style="color:#6D4AFF">x</span>');
      expect(render({ tone: "light" })).toContain('<span style="color:#AA97FF">x</span>');
    });

    it("scales the wordmark with the height", () => {
      expect(render({ height: 30 })).toContain("font-size:18px");
    });

    it("is one image: the ribbon and the text inside are hidden from assistive technology", () => {
      const html = render({ label: "SmartxDreams" });
      expect(html).toMatch(/^<span[^>]*role="img"[^>]*aria-label="SmartxDreams"/);
      expect(html.match(/role="img"/g)).toHaveLength(1);
      expect(html).toMatch(/<img[^>]*alt=""[^>]*aria-hidden="true"/);
    });

    it("hides everything when decorative", () => {
      const html = render({ decorative: true });
      expect(html).toMatch(/^<span[^>]*aria-hidden="true"/);
      expect(html).not.toContain("role=");
      expect(html).not.toContain("aria-label");
    });
  });
});
