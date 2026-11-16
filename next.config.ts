import type { NextConfig } from "next";
import imageConfig from "./src/lib/image-config.json";

// NEXT_OUTPUT=export builds a static site into out/. There is no server, so /api routes are omitted
// and forms cannot send email. The default build is the full server app that Vercel runs.
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  // React Compiler memoizes components automatically, so we avoid manual
  // useMemo/useCallback/memo calls in application code.
  reactCompiler: true,
  experimental: {
    // Rust port of the compiler (Turbopack only). Requires `reactCompiler`.
    turbopackRustReactCompiler: true,
  },
};

if (isStaticExport) {
  nextConfig.output = "export";
  // Tells forms there is no /api to post to, so they show a clear message instead (src/lib/forms/availability.ts).
  nextConfig.env = { NEXT_PUBLIC_STATIC_EXPORT: "true" };
  // The default image optimizer needs a server. The static export uses a custom loader that serves the
  // WebP variants pre-built by `npm run images`. Requested widths round up to those variants.
  nextConfig.images = {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: imageConfig.widths,
    imageSizes: [64, 128, 256, 384],
  };
}

export default nextConfig;
