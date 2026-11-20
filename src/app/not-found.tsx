import type { Metadata } from "next";
import Link from "next/link";
import { DidYouMean } from "@/components/not-found/DidYouMean";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { products } from "@/content/products";
import { mainNav } from "@/content/site";
import type { NavItem } from "@/content/types";
import { blogCategories } from "@/content/blog/categories";
import { allPosts } from "@/lib/blog/posts";
import { cx } from "@/lib/cx";
import { readyRoutes } from "@/lib/routes";
import { SplitText } from "@/components/motion/SplitText";

/** Suggestions come from the site content: the main pages (except Home, which has its own button)
 * followed by the products. Nothing is hard-coded here. */
const suggestions: NavItem[] = [
  ...mainNav.filter((item) => item.href !== "/"),
  ...products.map((p) => ({ label: p.name, href: `/products/${p.slug}`, description: p.tagline })),
];

/** Every real page, for the "Did you mean" suggestion: site routes, posts and blog categories. */
const knownPaths = [
  ...readyRoutes().map((r) => r.path),
  ...allPosts().map((p) => `/blog/${p.slug}`),
  ...blogCategories.map((c) => `/blog/category/${c.id}`),
];

// Next.js serves this page with HTTP 404 (and writes out/404.html in the static export). It should
// never be indexed.
export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist or has moved.",
  robots: { index: false, follow: true },
};

/** The three glass tiles, tilted alternately; the middle "0" glows coral. Decorative. */
const tiles = [
  { char: "4", tilt: "-rotate-6", glow: false },
  { char: "0", tilt: "rotate-3 -translate-y-3", glow: true },
  { char: "4", tilt: "rotate-6", glow: false },
];

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1}>
      {/* Uncontained: the backdrop is placed against the section, so it fills the page edge to edge and runs up
          behind the header. Inside Section's own Container it was a content-width box with hard edges. */}
      <Section surface="dark" labelledBy="not-found-title" contained={false} className="isolate min-h-[90svh] pt-36 md:pt-44">
        {/* A motorway disappearing into fog: a quiet nod to being lost. Decorative, under an ink veil so text keeps its contrast. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Photo slot="not-found" fill sizes="100vw" />
          <div className="absolute inset-0 bg-ink/80" />
        </div>
        {/* 96 px below the section's top padding, where it sat when it was placed against the container. */}
        <Glow color="coral" size={720} opacity={0.35} className="top-60 left-1/2 -translate-x-1/2 md:top-68" />
        <Container className="relative flex flex-col items-center text-center">
          <div aria-hidden="true" className="flex gap-3 md:gap-5">
            {tiles.map((tile, i) => (
              <span
                key={i}
                className={cx(
                  "flex size-24 items-center justify-center rounded-[26px] text-[3.5rem] leading-none ring-1 backdrop-blur-[15px] md:size-36 md:rounded-[34px] md:text-[5.5rem]",
                  tile.tilt,
                  tile.glow
                    ? "bg-coral-500/90 text-ink shadow-[0_20px_80px_rgb(255_107_61/0.45)] ring-coral-300/60"
                    : "bg-white/10 text-white ring-white/15",
                )}
              >
                {tile.char}
              </span>
            ))}
          </div>

          <Tag tone="dark" className="mt-12">
            Error 404 · Page not found
          </Tag>
          <h1 id="not-found-title" className="mt-5 max-w-2xl text-h2">
            <SplitText text="This page took a *wrong turn.*" tone="dark" aboveFold />
          </h1>
          <p className="mt-4 max-w-md text-body-l text-white/65">
            The link may be old, or the page may have moved. Here are the places people usually look for.
          </p>
          <DidYouMean paths={knownPaths} />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="coral">
              Back to home
            </Button>
            <Button href="/contact" variant="ghost">
              Contact us
            </Button>
          </div>

          <nav aria-label="Suggested pages" className="mt-12 w-full max-w-3xl">
            <ul className="grid gap-2 text-left sm:grid-cols-2">
              {suggestions.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex h-full flex-col rounded-[18px] bg-white/[0.06] px-5 py-4 ring-1 ring-white/10 transition-colors duration-250 hover:bg-white/10"
                  >
                    <span className="text-body-l text-white">{item.label}</span>
                    {item.description ? <span className="mt-1 text-label text-white/65">{item.description}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>
    </main>
  );
}
