import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for logic that does not need a browser: validation, spam guards, rate limiting, tokens, the
 * content model and the blog loader. Tests live next to the code as *.test.ts and run in Node.
 * Run with `npm test`; CI runs them in its one "CI passed" job, after the type check.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});
