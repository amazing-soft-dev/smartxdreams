import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { Accent } from "@/components/ui/Accent";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { contact } from "@/content/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Ask about a SmartxDreams product, suggest one we should build, or make a request about your data. A person reads every message.",
  path: "/contact",
});

/** /contact: ways to reach the studio, the contact form and practical questions. */
export default function ContactPage() {
  return (
    <main>
      <section
        aria-labelledby="contact-title"
        data-surface="dark"
        data-nav-theme="dark"
        className="relative isolate overflow-hidden bg-ink pt-36 pb-20 text-white md:pt-44 md:pb-24"
      >
        <Glow color="violet" size={880} opacity={0.4} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container>
          <div className="text-center">
            <Tag tone="dark">Contact</Tag>
            <h1 id="contact-title" className="mx-auto mt-6 max-w-3xl text-display">
              <Accent text={contact.hero.title} tone="dark" />
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">{contact.hero.body}</p>
          </div>
          <ul className="mt-14 grid gap-3 md:grid-cols-3">
            {contact.channels.map((channel, i) => (
              <li key={channel.title}>
                <Reveal delay={i * 0.08} className="h-full" aboveFold>
                  <Card tone="glass-dark" padding="lg" className="flex h-full flex-col">
                    <h2 className="text-h6">{channel.title}</h2>
                    <p className="mt-3 flex-1 text-body text-white/70">{channel.body}</p>
                    <Link href={channel.href} className="mt-6 text-label font-medium text-violet-300 underline underline-offset-4">
                      {channel.cta}
                    </Link>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Section id="contact-form" labelledBy="contact-form-title" surface="canvas" className="scroll-mt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader
            id="contact-form-title"
            tag="Message"
            title="Send us a *message*."
            description="Every field is required. A person reads each message and replies by email."
            align="left"
          />
          <Card padding="lg">
            <ContactForm />
          </Card>
        </div>
      </Section>
    </main>
  );
}
