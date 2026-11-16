import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal/terms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description:
    "The rules for using the SmartxDreams website and its waitlists, acceptable use, and why our products are not medical, legal or financial advice.",
  path: "/terms",
});

/** /terms: the website terms of use (draft pending legal review). */
export default function TermsPage() {
  return <LegalPage doc={termsOfUse} />;
}
