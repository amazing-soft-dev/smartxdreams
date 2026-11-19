import { type APIRequestContext, expect, test } from "@playwright/test";
import { pageRoutes } from "./routes";

/**
 * Link-preview and canonical metadata in the served HTML. A page that sets its own Open Graph data replaces
 * the root layout's whole object, so the social image is checked on every route, not only on Home.
 *
 * The metadata is in the HTML the server sends and does not depend on the viewport, so the pages are
 * fetched, not opened in a browser, and only once (on the desktop project): opening every route twice more,
 * Home's scene included, slowed the whole suite enough to time other tests out.
 */
const NOT_FOUND = "/this-page-does-not-exist";

test.skip(({ isMobile }) => isMobile, "the served HTML is the same for every viewport");

/** The <head> of a route, as served. */
async function headOf(request: APIRequestContext, route: string): Promise<string> {
  const html = await (await request.get(route)).text();
  return html.slice(0, html.indexOf("</head>"));
}

/** Every tag in the head whose text contains `marker`, e.g. 'property="og:image"'. */
const tags = (head: string, marker: string) => (head.match(/<(?:meta|link)\b[^>]*>/g) ?? []).filter((tag) => tag.includes(marker));

/** The value of one attribute of a tag, with HTML entities for & decoded. */
const attribute = (tag: string | undefined, name: string) =>
  tag?.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]?.replaceAll("&amp;", "&") ?? "";

for (const route of [...pageRoutes, NOT_FOUND]) {
  test(`${route} has one Open Graph image and one Twitter image`, async ({ request }) => {
    const head = await headOf(request, route);
    for (const marker of ['property="og:image"', 'name="twitter:image"']) {
      const found = tags(head, marker);
      expect(found, marker).toHaveLength(1);
      expect(attribute(found[0], "content"), marker).toMatch(/^https?:\/\/[^/]+\/opengraph-image(\?|$)/);
    }
  });
}

test("the social image is served as the PNG its metadata describes", async ({ request }) => {
  const head = await headOf(request, "/about");
  const content = attribute(tags(head, 'property="og:image"')[0], "content");
  // The metadata names the public origin (NEXT_PUBLIC_SITE_URL); the test server has the image under its own.
  const { pathname, search } = new URL(content);
  const response = await request.get(pathname + search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  // A PNG states its width and height at bytes 16 and 20.
  const png = await response.body();
  expect(attribute(tags(head, 'property="og:image:width"')[0], "content")).toBe(String(png.readUInt32BE(16)));
  expect(attribute(tags(head, 'property="og:image:height"')[0], "content")).toBe(String(png.readUInt32BE(20)));
  expect(attribute(tags(head, 'property="og:image:alt"')[0], "content")).toMatch(/SmartxDreams/);
});

test("link previews show the page title with the company name", async ({ request }) => {
  const head = await headOf(request, "/about");
  expect(head).toContain("<title>About | SmartxDreams</title>");
  expect(attribute(tags(head, 'property="og:title"')[0], "content")).toBe("About | SmartxDreams");
  expect(attribute(tags(head, 'name="twitter:title"')[0], "content")).toBe("About | SmartxDreams");
});

test("Home names itself as canonical", async ({ request }) => {
  const head = await headOf(request, "/");
  expect(attribute(tags(head, 'rel="canonical"')[0], "href")).toMatch(/^https?:\/\/[^/]+\/?$/);
  expect(attribute(tags(head, 'property="og:url"')[0], "content")).toMatch(/^https?:\/\/[^/]+\/?$/);
});

for (const route of [NOT_FOUND, "/waitlist/confirm"]) {
  test(`${route} does not claim another page's address`, async ({ request }) => {
    const head = await headOf(request, route);
    expect(tags(head, 'rel="canonical"')).toHaveLength(0);
    expect(tags(head, 'property="og:url"')).toHaveLength(0);
  });
}

test("the blog index links the feed", async ({ request }) => {
  const head = await headOf(request, "/blog");
  const feeds = tags(head, 'type="application/rss+xml"');
  expect(feeds).toHaveLength(1);
  expect(attribute(feeds[0], "href")).toMatch(/\/blog\/rss\.xml$/);
});
