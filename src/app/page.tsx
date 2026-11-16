import { CtaSection } from "@/components/sections/CtaSection";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  return (
    <main>
      {/* Placeholder hero until the Home issues land. The logo is decorative: the h1 names the company. */}
      <section data-nav-theme="light" className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-5 pt-32 text-center">
        <Logo height={96} decorative priority />
        <h1 className="text-display">SmartxDreams</h1>
        <p className="text-body-l text-ink/65">The new SmartxDreams website is under construction.</p>
      </section>
      <CtaSection />
    </main>
  );
}
