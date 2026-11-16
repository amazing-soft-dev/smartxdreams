import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { products } from "@/content/products";
import { TypedWord } from "./TypedWord";

const names = products.map((p) => p.name);

/**
 * The closing call to action on content pages: "Be the first to try" with the product names typed in turn.
 * Screen readers get one static sentence; the typed word is decorative.
 */
export function CtaSection() {
  return (
    <Section surface="dark" labelledBy="cta-title" className="text-center">
      <Glow color="violet" size={820} opacity={0.4} className="-bottom-1/2 left-1/2 -translate-x-1/2" />
      <div className="flex flex-col items-center">
        <Tag tone="dark">Early access</Tag>
        <h2 id="cta-title" className="mt-6 max-w-3xl text-h2">
          <span className="sr-only">Be the first to try SmartxDreams products.</span>
          <span aria-hidden="true">
            Be the first to try{" "}
            <TypedWord words={names} className="text-violet-300" />
          </span>
        </h2>
        <p className="mt-5 max-w-xl text-body-l text-white/65">
          Every product starts with a short waitlist. Join the ones you care about and we will email you when early
          access opens.
        </p>
      </div>
    </Section>
  );
}
