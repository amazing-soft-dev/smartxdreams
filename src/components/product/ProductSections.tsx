import Link from "next/link";
import type { ComponentType } from "react";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { FaqSection } from "@/components/sections/FaqSection";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { ProductCard } from "@/components/products/ProductCard";
import { audienceLabel, relatedProducts } from "@/content/selectors";
import type { Product } from "@/content/types";
import { ProductLogo } from "./ProductLogo";

type ProductProps = { product: Product };

/**
 * Product hero: dark stage with the product name as the page h1, its tagline and summary, the waitlist
 * call to action, and the product mockup on the right (or below on phones).
 */
export function ProductHero({ product, Mockup }: ProductProps & { Mockup?: ComponentType<{ className?: string }> }) {
  return (
    <section
      aria-labelledby="product-title"
      data-surface="dark"
      data-nav-theme="dark"
      className="relative isolate overflow-hidden bg-ink pt-32 pb-20 text-white md:pt-40 md:pb-28"
    >
      <Glow color="violet" size={1000} opacity={0.4} className="-top-1/2 -left-1/4" />
      <Glow color="coral" size={640} opacity={0.25} className="-right-1/4 -bottom-1/3" />
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          {/* The product's logo leads the hero, with who it is for beside it. */}
          <Reveal aboveFold preset="left60" delay={0.15} className="flex items-center gap-4">
            <ProductLogo product={product} size={64} decorative loading="eager" />
            <Tag tone="dark">{audienceLabel(product.audience)}</Tag>
          </Reveal>
          <Reveal aboveFold delay={0.3}>
            <h1 id="product-title" className="mt-6 text-display">
              {product.name}
            </h1>
            <p className="mt-4 max-w-xl text-h4 text-violet-300">{product.tagline}</p>
          </Reveal>
          <Reveal aboveFold delay={0.42}>
            <p className="mt-6 max-w-xl text-body-l text-white/70">{product.summary}</p>
          </Reveal>
          <Reveal aboveFold delay={0.54} className="mt-9 flex flex-wrap gap-3">
            <Button href="#waitlist" variant="coral" size="lg">
              Join the waitlist
            </Button>
            <Button href="#how-it-works" variant="ghost" size="lg" icon={false}>
              How it works
            </Button>
          </Reveal>
          {/* Products that need one show their disclaimer right in the hero, not only further down. */}
          {product.disclaimer ? (
            <Reveal aboveFold delay={0.62}>
              <p className="mt-6 max-w-xl text-label text-white/70">{product.disclaimer}</p>
            </Reveal>
          ) : null}
        </div>
        {Mockup ? (
          <Reveal aboveFold preset="waveUp" delay={0.4} className="mx-auto w-full max-w-md">
            {/* The product is not built yet, so the screen is labelled as an illustration, not a screenshot. */}
            <p className="mb-4 text-center text-micro text-white/65">Illustrative screen. {product.name} is in development.</p>
            <Mockup />
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}

/** The problem, in the user's words, as one large statement. */
export function ProductProblem({ product }: ProductProps) {
  return (
    <Section labelledBy="problem-title" surface="canvas">
      <div className="mx-auto max-w-4xl text-center">
        <Tag>The problem</Tag>
        <h2 id="problem-title" className="mt-6 text-h3">
          {product.problem}
        </h2>
      </div>
    </Section>
  );
}

/** How it works: the product's three or four steps as numbered cards. */
export function ProductSteps({ product }: ProductProps) {
  return (
    <Section id="how-it-works" labelledBy="how-it-works-title" surface="white">
      <SectionHeader id="how-it-works-title" tag="How it works" title={`*${product.name}* in ${product.steps.length} steps.`} />
      <ol className="mt-14 grid gap-3 md:grid-cols-3">
        {product.steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.08} className="h-full">
              <Card tone="canvas" padding="lg" className="h-full">
                <span className="font-mono text-micro tracking-[0.06em] text-ink/70">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-h5">{step.title}</h3>
                <p className="mt-3 text-body text-ink/70">{step.body}</p>
              </Card>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** What the product does, as a bento of features. Renders nothing until the product has features. */
export function ProductFeatures({ product }: ProductProps) {
  if (product.features.length === 0) return null;
  return (
    <Section labelledBy="features-title" surface="canvas">
      <SectionHeader id="features-title" tag="Features" title="What it *does for you.*" />
      <ul className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {product.features.map((feature, i) => (
          <li key={feature.title} className={i === 0 ? "lg:col-span-2" : undefined}>
            <Reveal delay={(i % 3) * 0.08} className="h-full">
              <Card tone={i === 0 ? "ink" : "white"} padding="lg" className="h-full">
                <h3 className="text-h5">{feature.title}</h3>
                <p className={i === 0 ? "mt-3 text-body text-white/75" : "mt-3 text-body text-ink/70"}>{feature.body}</p>
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Honest limits: who the product is for, what it does not do, and the product's disclaimer when it has one.
 * Shown on every product page, so nobody signs up for something the product will not do.
 */
export function ProductLimits({ product }: ProductProps) {
  return (
    <Section labelledBy="limits-title" surface="white">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          {product.photo ? (
            <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-[30px]">
              <Photo slot={product.photo.slot} fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          ) : null}
          <Tag>Who it is for</Tag>
          <ul className="mt-6 flex flex-col gap-3">
            {product.whoFor.map((who) => (
              <li key={who} className="flex gap-3 text-body-l">
                <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-violet-500" />
                {who}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Tag>What it does not do</Tag>
          <h2 id="limits-title" className="sr-only">
            Limits of {product.name}
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {product.limits.map((limit) => (
              <li key={limit} className="flex gap-3 text-body text-ink/75">
                <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full border border-ink/40" />
                {limit}
              </li>
            ))}
          </ul>
          {product.disclaimer ? (
            <p className="mt-8 rounded-[18px] bg-coral-50 px-5 py-4 text-label text-coral-900">
              <strong className="font-medium">Please note: </strong>
              {product.disclaimer}
            </p>
          ) : null}
          {product.dataHandling && product.dataHandling.length > 0 ? (
            <div className="mt-8 rounded-[22px] bg-canvas p-6">
              <h3 className="text-h6">Your data</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {product.dataHandling.map((line) => (
                  <li key={line} className="flex gap-3 text-label text-ink/75">
                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" className="mt-0.5 shrink-0 text-violet-600" fill="none">
                      <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {product.footnote ? <p className="mt-6 text-micro text-ink/65">{product.footnote}</p> : null}
        </div>
      </div>
    </Section>
  );
}

/**
 * Waitlist slot at the end of every product page (anchor #waitlist, the hero button's target). The form
 * here is the inline stub until the waitlist API and form issues wire it to this product.
 */
export function ProductWaitlist({ product }: ProductProps) {
  return (
    <Section id="waitlist" labelledBy="waitlist-title" surface="dark" className="text-center">
      <Glow color="violet" size={760} opacity={0.35} className="-bottom-1/2 left-1/2 -translate-x-1/2" />
      <div className="flex flex-col items-center">
        <Tag tone="dark">Waitlist</Tag>
        <h2 id="waitlist-title" className="mt-6 max-w-2xl text-h2">
          Be first to try <span className="text-violet-300">{product.name}.</span>
        </h2>
        <p className="mt-5 max-w-xl text-body-l text-white/70">
          We will email you once when early access opens. No newsletters, and you can leave the list at any time.
        </p>
        <WaitlistForm product={{ slug: product.slug, name: product.name }} />
      </div>
    </Section>
  );
}

/** Product questions, with FAQPage JSON-LD. Renders nothing until the product has FAQs. */
export function ProductFaq({ product }: ProductProps) {
  if (product.faq.length === 0) return null;
  return (
    <FaqSection
      id="product-faq"
      items={product.faq}
      title={`${product.name} *questions.*`}
      footer={
        <>
          Something else you want to know?{" "}
          <Link href={`/contact?product=${product.slug}#contact-form`} className="font-medium text-ink underline underline-offset-4">
            Ask us about {product.name}
          </Link>
          .
        </>
      }
    />
  );
}

/** The product's core promise as a full-width band. Renders nothing for products without one. */
export function ProductPromise({ product }: ProductProps) {
  if (!product.promise) return null;
  return (
    <Section labelledBy="promise-title" surface="dark" className="text-center">
      <div className="mx-auto max-w-3xl">
        <Tag tone="dark">Our promise</Tag>
        <h2 id="promise-title" className="mt-6 text-h2">
          {product.promise.title}
        </h2>
        <p className="mt-5 text-body-l text-white/70">{product.promise.body}</p>
      </div>
    </Section>
  );
}

/** Other products worth a look: the product's related list, never the product itself. */
export function ProductRelated({ product }: ProductProps) {
  const related = relatedProducts(product).filter((p) => p.slug !== product.slug);
  if (related.length === 0) return null;
  return (
    <Section labelledBy="related-title" surface="canvas">
      <SectionHeader id="related-title" tag="Related" title="You might also *like*." align="left" />
      <ul className="mt-10 grid gap-3 md:grid-cols-2">
        {related.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
