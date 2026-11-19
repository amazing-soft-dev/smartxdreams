import type { NextConfig } from "next";
import imageConfig from "./src/lib/image-config.json";
import { siteRedirects } from "./src/lib/redirects";
import { securityHeaders } from "./src/lib/security-headers";

// NEXT_OUTPUT=export builds a static site into out/. There is no server, so /api routes are omitted
// and forms cannot send email. The default build is the full server app that Vercel runs.
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js" header.
  poweredByHeader: false,
  // API route handlers are named route.api.ts. Only the server build lists "api.ts" here, so the static
  // export never sees them: no /api in out/, and no build error for handlers that need a server.
  pageExtensions: isStaticExport ? ["tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js", "api.ts"],
  // React Compiler memoizes components automatically, so we avoid manual
  // useMemo/useCallback/memo calls in application code.
  reactCompiler: true,
  experimental: {
    // Rust port of the compiler (Turbopack only). Requires `reactCompiler`.
    turbopackRustReactCompiler: true,
  },
  turbopack: {
    // "motion/react" is a thin wrapper around framer-motion (motion's own dependency) that reads the full
    // `motion` component into a top-level constant. Turbopack drops unused exports but keeps a module's
    // top-level statements, so any import through the wrapper, even of a hook, pulled every Motion feature
    // (drag, layout projection) into the shared chunk, and LazyMotion with the `m` component saved nothing.
    // Resolving the wrapper straight to the package it re-exports loads the same modules without that
    // constant: 14 KB gzipped less on every page without a filtered list (docs/performance.md).
    resolveAlias: { "motion/react": "framer-motion" },
  },
};

if (!isStaticExport) {
  // Security headers and CSP on every route of the server build (src/lib/security-headers.ts).
  const headers = securityHeaders({ dev: process.env.NODE_ENV !== "production", preview: process.env.VERCEL_ENV === "preview" });
  nextConfig.headers = async () => [{ source: "/:path*", headers }];
  // Likely aliases and old links (src/lib/redirects.ts).
  nextConfig.redirects = async () => siteRedirects;
}

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
