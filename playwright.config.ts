import { defineConfig, devices } from "@playwright/test";

const PORT = 3400;

/**
 * End-to-end checks against the production server build (`npm run build` first): a smoke test of every
 * route, axe accessibility checks and the throttled-phone vitals. CI runs them in its one "CI passed" job.
 * Run locally with `npm run test:e2e` (after `npx playwright install chromium` once).
 */

/** The throttled-phone LCP and CLS check measures wall-clock time, so it runs on its own (see `vitals`). */
const VITALS = /vitals\.spec\.ts$/;
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: VITALS },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: VITALS },
    // After every other test has finished, so no parallel worker competes for the CPU while it measures
    // (with workers running beside it, Home's LCP read 2.9-3.0 s instead of 1.9-2.4 s).
    { name: "vitals", use: { ...devices["Pixel 7"] }, testMatch: VITALS, dependencies: ["desktop", "mobile"] },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
