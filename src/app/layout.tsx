import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import type { ReactNode } from "react";
import { VercelInsights } from "@/components/perf/VercelInsights";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/nav/Header";
import { VitalsReporter } from "@/components/perf/VitalsReporter";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

/**
 * Inter Tight, self-hosted by next/font (no request to Google at runtime).
 * - Variable font: one file covers weights 100-900.
 * - Only the Latin subset is preloaded: one woff2 of about 44 KB. Other subsets are declared with
 *   unicode-range and downloaded only if a page uses those characters, which English copy does not.
 * - display: swap shows text at once in the fallback; adjustFontFallback sizes that fallback (Arial) to
 *   Inter Tight's metrics, so the swap does not shift the layout.
 * Exposed as a CSS variable for the @theme font stack.
 */
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-inter-tight",
});

// Vercel Web Analytics and Speed Insights run only on the production deployment, never on previews,
// local builds or the static export.
const isProduction = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={interTight.variable}>
      <head>
        {/* Without JavaScript, reveal animations never run: show their content instead. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <VitalsReporter />
        <SmoothScroll>
          <MotionProvider>
            <TransitionProvider>
              {/* First stop for keyboard and screen-reader users: jump past the header to the page content. */}
              <a
                href="#main"
                className="fixed top-3 left-3 z-[200] inline-flex min-h-11 -translate-y-24 items-center rounded-full bg-ink px-5 text-label font-medium text-white shadow-tag focus:translate-y-0 focus:outline-violet-300"
              >
                Skip to content
              </a>
              <Header />
              {children}
              <Footer />
            </TransitionProvider>
          </MotionProvider>
        </SmoothScroll>
        {isProduction ? <VercelInsights /> : null}
      </body>
    </html>
  );
}
