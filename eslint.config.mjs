import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Metadata image routes render <img> to a PNG with next/og; there is no DOM and next/image cannot
    // work there. @next/next/no-img-element already exempts these files by path, but its path check
    // only matches forward slashes, so on Windows it still reports them. Exempt them here so lint
    // gives the same result on every OS, without inline disables that CI would flag as unused.
    files: ["src/app/**/{opengraph-image,twitter-image,icon,apple-icon}.{js,jsx,ts,tsx}"],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    // Static brand and image assets, not source code.
    "public/**",
    "design/**",
  ]),
]);
