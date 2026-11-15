import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler memoizes components automatically, so we avoid manual
  // useMemo/useCallback/memo calls in application code.
  reactCompiler: true,
  experimental: {
    // Rust port of the compiler (Turbopack only). Requires `reactCompiler`.
    turbopackRustReactCompiler: true,
  },
};

export default nextConfig;
