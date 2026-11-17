import type { MetadataRoute } from "next";
import { company } from "@/content/site";

// Static so it is written to out/manifest.webmanifest in the static export.
export const dynamic = "force-static";

/**
 * Install icons. The PNGs are the dark mark, which sits on the light background_color below;
 * the SVG switches to the light strokes by itself in dark mode.
 */
const ICON_SET = "/brand/smartxdreams-dark-1x1-transparent";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: company.name,
    short_name: company.name,
    description: company.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#F5F2EE",
    theme_color: "#0F1226",
    icons: [
      { src: `${ICON_SET}/android-chrome-192x192.png`, sizes: "192x192", type: "image/png" },
      { src: `${ICON_SET}/android-chrome-512x512.png`, sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
