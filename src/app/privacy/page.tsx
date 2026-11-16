import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal/privacy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "What the SmartxDreams website collects through waitlists and the contact form, why, which services process it (Vercel, Resend), and how to have it deleted.",
  path: "/privacy",
});

/** /privacy: the website privacy policy (draft pending legal review). */
export default function PrivacyPage() {
  return <LegalPage doc={privacyPolicy} />;
}
