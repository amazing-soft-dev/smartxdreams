import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./globals.css";

// Variable font: one file covers every weight. Exposed as a CSS variable for the @theme font stack.
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

// Vercel Web Analytics and Speed Insights run only on the production deployment, never on previews,
// local builds or the static export.
const isProduction = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  title: "SmartxDreams",
  description: "SmartxDreams builds AI products for everyday work and life.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={interTight.variable}>
      <head>
        {/* Without JavaScript, reveal animations never run: show their content instead. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll>
          <MotionProvider>{children}</MotionProvider>
        </SmoothScroll>
        {isProduction ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
