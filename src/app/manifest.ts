import type { MetadataRoute } from "next";
import { company } from "@/content/site";

// Static so it is written to out/manifest.webmanifest in the static export.
export const dynamic = "force-static";

/**
 * Install icons, built by scripts/build-brand.mjs. The 192 and 512 PNGs are the charcoal mark on
 * transparency, which sits on the light background_color below; the maskable one is the white mark on an
 * opaque ink square that Android may crop to any shape; the SVG swaps marks by itself in dark mode.
 */
const ICON_SET = "/brand/icons";

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
      { src: `${ICON_SET}/maskable-512x512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
