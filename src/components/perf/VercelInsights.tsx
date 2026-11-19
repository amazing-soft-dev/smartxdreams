"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { reportableUrl } from "@/lib/analytics-url";

/**
 * Vercel Web Analytics and Speed Insights, reporting each page through reportableUrl() so the waitlist
 * confirmation token never leaves the browser inside a page address (src/lib/analytics-url.ts).
 * A client component because beforeSend is a function, which a server component cannot pass down.
 */
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: reportableUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: reportableUrl(event.url) })} />
    </>
  );
}
