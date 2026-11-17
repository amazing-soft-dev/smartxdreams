"use client";

import { useReportWebVitals } from "next/web-vitals";

type ShiftEntry = PerformanceEntry & { value?: number; sources?: { node?: Node | null }[] };
type LcpEntry = PerformanceEntry & { element?: Element | null };

const describe = (node: Node | null | undefined) => {
  if (!(node instanceof Element)) return "unknown";
  const text = node.textContent?.trim().slice(0, 40);
  return `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${text ? ` "${text}"` : ""}`;
};

/**
 * Logs Core Web Vitals to the console, with what caused them: the LCP element and the elements behind each
 * layout shift. Off unless the URL has ?vitals (or in development), so production visitors are unaffected;
 * field data comes from Vercel Speed Insights. See docs/performance.md.
 */
export function VitalsReporter() {
  useReportWebVitals((metric) => {
    const enabled = process.env.NODE_ENV === "development" || new URLSearchParams(window.location.search).has("vitals");
    if (!enabled) return;
    const value = metric.name === "CLS" ? metric.value.toFixed(3) : `${Math.round(metric.value)} ms`;
    let detail = "";
    if (metric.name === "LCP") detail = describe((metric.entries.at(-1) as LcpEntry | undefined)?.element);
    if (metric.name === "CLS") {
      detail = (metric.entries as ShiftEntry[])
        .map((e) => `${(e.value ?? 0).toFixed(3)} ${e.sources?.map((s) => describe(s.node)).join(", ") ?? ""}`)
        .join(" | ");
    }
    console.info(`[vitals] ${metric.name} ${value} (${metric.rating})${detail ? `: ${detail}` : ""}`);
  });
  return null;
}
