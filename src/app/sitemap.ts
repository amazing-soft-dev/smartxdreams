import type { MetadataRoute } from "next";
import { readyRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

// Static so it is written to out/sitemap.xml in the static export.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return readyRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
