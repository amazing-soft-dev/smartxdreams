import { describe, expect, it } from "vitest";
import config from "./image-config.json";
import imageLoader from "./image-loader";

describe("imageLoader (static export)", () => {
  it("serves the 320 px variant for small images such as thumbnails", () => {
    expect(imageLoader({ src: "/images/about/story.jpg", width: 64 })).toBe("/_img/about/story-320.webp");
    expect(imageLoader({ src: "/images/about/story.jpg", width: 128 })).toBe("/_img/about/story-320.webp");
    expect(imageLoader({ src: "/images/about/story.jpg", width: 320 })).toBe("/_img/about/story-320.webp");
  });

  it("rounds a requested width up to the next variant", () => {
    expect(imageLoader({ src: "/images/home/step-1.jpg", width: 321 })).toBe("/_img/home/step-1-640.webp");
    expect(imageLoader({ src: "/images/home/step-1.jpg", width: 900 })).toBe("/_img/home/step-1-1024.webp");
    expect(imageLoader({ src: "/images/home/step-1.jpg", width: 1600 })).toBe("/_img/home/step-1-1600.webp");
  });

  it("caps requests wider than the largest variant at the largest one", () => {
    expect(imageLoader({ src: "/images/site/contact.jpg", width: 3840 })).toBe("/_img/site/contact-2400.webp");
  });

  it("keeps sub-folders and swaps any photo extension for .webp", () => {
    expect(imageLoader({ src: "/images/blog/job-search.jpeg", width: 640 })).toBe("/_img/blog/job-search-640.webp");
    expect(imageLoader({ src: "/images/products/senioraiplans.png", width: 640 })).toBe("/_img/products/senioraiplans-640.webp");
  });

  it("passes non-photo sources through with the width as a query", () => {
    expect(imageLoader({ src: "/brand/logo.svg", width: 256 })).toBe("/brand/logo.svg?w=256");
    expect(imageLoader({ src: "/brand/logo.png?v=2", width: 128 })).toBe("/brand/logo.png?v=2&w=128");
  });

  it("only ever returns widths that npm run images builds", () => {
    const built = new Set(config.widths);
    for (const width of [16, 64, 256, 384, 640, 750, 1080, 1200, 1920, 2048, 3840]) {
      const variant = Number(/-(\d+)\.webp$/.exec(imageLoader({ src: "/images/a/b.jpg", width }))?.[1]);
      expect(built.has(variant), `${width} px maps to a built variant`).toBe(true);
    }
  });
});
