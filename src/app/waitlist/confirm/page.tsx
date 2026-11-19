import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ConfirmWaitlist } from "@/components/waitlist/ConfirmWaitlist";
import { products } from "@/content/products";

/** A personal page reached from an email: never indexed. */
export const metadata: Metadata = {
  title: "Confirm your waitlist place",
  robots: { index: false, follow: false },
};

const productNames = products.map((p) => ({ slug: p.slug, name: p.name }));

/** /waitlist/confirm#token=…: the second step of double opt-in. */
export default function ConfirmWaitlistPage() {
  return (
    <main id="main" tabIndex={-1} data-nav-theme="light" className="bg-canvas pt-40 pb-28 md:pt-48">
      <Container>
        <div className="mx-auto max-w-2xl rounded-[30px] bg-white px-6 py-12 md:px-12">
          {/* The token is in the URL, so the page reads it in the browser. */}
          <Suspense fallback={<p className="text-center text-body-l text-ink/70">Loading your confirmation…</p>}>
            <ConfirmWaitlist products={productNames} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
