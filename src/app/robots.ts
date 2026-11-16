import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

// Static so it is written to out/robots.txt in the static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
