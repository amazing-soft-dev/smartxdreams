import { TransitionLink } from "@/components/transition/TransitionLink";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { FooterSmoke } from "./FooterSmoke";
import { FooterStars } from "./FooterStars";
import { SocialIcons } from "./SocialIcons";
import { products } from "@/content/products";
import { company, footerGroups, trademarkNote } from "@/content/site";
import type { NavGroup } from "@/content/types";

/** The Products group is built from the product files, so a new product appears here automatically. */
const productGroup: NavGroup = {
  label: "Products",
  items: products.map((p) => ({ label: p.name, href: `/products/${p.slug}` })),
};

/** Privacy and Terms, repeated in the bottom bar. */
const legalLinks = footerGroups.find((g) => g.label === "Legal")?.items ?? [];

/** Dark site footer under a night sky: brand column, link groups, and a bottom bar with the copyright,
 * legal links and the third-party trademark note. The sky (stars, then the smoke) sits behind it all. */
export function Footer() {
  const groups = [productGroup, ...footerGroups];
  const year = new Date().getFullYear();
  return (
    <footer data-surface="dark" data-nav-theme="dark" className="relative isolate overflow-hidden bg-ink bg-linear-to-b from-space to-ink text-white">
      <FooterStars />
      <FooterSmoke />
      <Container className="relative pt-20 pb-10 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="max-w-sm">
            <TransitionLink href="/" aria-label="SmartxDreams home" className="inline-flex min-h-11 items-center rounded-md">
              {/* The smoke drifts and its brightest plumes can pass behind the logo: a soft ink shadow keeps the
                  white ribbon and wordmark at the contrast they have on plain ink. */}
              <Logo tone="light" height={30} decorative className="drop-shadow-[0_1px_10px_rgb(15_18_38/0.6)]" />
            </TransitionLink>
            <p className="mt-5 text-body text-white/65">{company.tagline}</p>
            <SocialIcons />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-label font-medium text-white">{group.label}</h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <TransitionLink
                        href={item.href}
                        className="inline-flex min-h-11 min-w-11 items-center text-label text-white/65 transition-colors duration-250 ease-[var(--ease-standard)] hover:text-white"
                      >
                        {item.label}
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-micro text-white/60">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p>
              © {year} {company.name}. All rights reserved.
            </p>
            <ul className="flex gap-5">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
          <p className="max-w-3xl">{trademarkNote}</p>
        </div>
      </Container>
    </footer>
  );
}
