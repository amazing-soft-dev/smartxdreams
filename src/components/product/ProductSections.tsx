import type { ComponentType } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { audienceLabel } from "@/content/selectors";
import type { Product } from "@/content/types";

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
          <Reveal aboveFold preset="left60" delay={0.15}>
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
        </div>
        {Mockup ? (
          <Reveal aboveFold preset="waveUp" delay={0.4} className="mx-auto w-full max-w-md">
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
