import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { products } from "@/content/products";
import { company, footerGroups } from "@/content/site";
import type { NavGroup } from "@/content/types";

/** The Products group is built from the product files, so a new product appears here automatically. */
const productGroup: NavGroup = {
  label: "Products",
  items: products.map((p) => ({ label: p.name, href: `/products/${p.slug}` })),
};

/** Dark site footer: brand column and link groups. */
export function Footer() {
  const groups = [productGroup, ...footerGroups];
  return (
    <footer data-surface="dark" data-nav-theme="dark" className="relative isolate overflow-hidden bg-ink text-white">
      <Container className="relative pt-20 pb-10 md:pt-24">
        <div className="grid gap-12">
          <div className="max-w-sm">
            <Link href="/" aria-label="SmartxDreams home" className="inline-flex rounded-md">
              <Logo tone="light" height={30} decorative />
            </Link>
            <p className="mt-5 text-body text-white/65">{company.tagline}</p>
          </div>

          <nav aria-label="Footer" className="grid gap-10">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-label font-medium text-white">{group.label}</h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-10 items-center text-label text-white/65 transition-colors duration-250 ease-[var(--ease-standard)] hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
