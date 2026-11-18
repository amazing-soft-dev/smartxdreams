import { expect, test } from "@playwright/test";

/**
 * Home's Core Web Vitals on a throttled phone, the launch target in docs/performance.md:
 * LCP under 2.5 s and CLS under 0.05. Throttling matches Lighthouse's mobile defaults: "slow 4G"
 * (150 ms latency, 1.6 Mbps down, 750 kbps up) and a 4x CPU slowdown, applied through the Chrome DevTools
 * Protocol. Runs in the `vitals` project only (playwright.config.ts): a Pixel 7, after every other test has
 * finished, so no other test competes for the CPU while it measures.
 */
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.05;

test("Home meets the LCP and CLS targets on a throttled phone", async ({ page }, testInfo) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  // Start observing before the page's own scripts run, so no entry is missed.
  await page.addInitScript(() => {
    const store = { lcp: 0, lcpElement: "", cls: 0 };
    (window as unknown as { __vitals: typeof store }).__vitals = store;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element })[]) {
        store.lcp = entry.startTime;
        store.lcpElement = entry.element ? `${entry.element.tagName.toLowerCase()} ${entry.element.textContent?.slice(0, 40) ?? ""}` : "";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) store.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto("/", { waitUntil: "load" });
  // LCP is final at the first input; wait for late work (fonts, lazy scenes) to settle, then read.
  await page.waitForTimeout(4000);
  const vitals = await page.evaluate(() => (window as unknown as { __vitals: { lcp: number; lcpElement: string; cls: number } }).__vitals);
  testInfo.annotations.push({
    type: "vitals",
    description: `LCP ${Math.round(vitals.lcp)} ms (${vitals.lcpElement}), CLS ${vitals.cls.toFixed(3)}`,
  });
  console.log(`Home, throttled phone: LCP ${Math.round(vitals.lcp)} ms (${vitals.lcpElement}), CLS ${vitals.cls.toFixed(3)}`);

  expect(vitals.lcp, "LCP was not recorded").toBeGreaterThan(0);
  expect(vitals.lcp).toBeLessThan(LCP_BUDGET_MS);
  expect(vitals.cls).toBeLessThan(CLS_BUDGET);
});
