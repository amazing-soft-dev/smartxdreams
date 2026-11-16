import type { NextConfig } from "next";

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
  // The default image optimizer needs a server. Issue #2 replaces this with a custom loader that
  // serves pre-built responsive WebP files.
  nextConfig.images = { unoptimized: true };
}

export default nextConfig;
