import type { Metadata } from "next";
import { company } from "@/content/site";
import { publicEnv } from "./env";
import { photoBySlot } from "@/content/photos";
import { team } from "@/content/team";
import type { Person } from "@/content/types";
import imageLoader from "./image-loader";

/** Canonical origin without a trailing slash, from NEXT_PUBLIC_SITE_URL. */
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;

/** Absolute URL for a site path: absoluteUrl("/about") -> "https://www.example.com/about". */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}

/**
 * Site-wide defaults, set once in the root layout. Pages override title and description and name their own
 * canonical address; the defaults name none, so a page without metadata (the 404 page) never claims Home's.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${company.name}: ${company.tagline}`,
    template: `%s | ${company.name}`,
  },
  description: company.description,
  applicationName: company.name,
  openGraph: {
    type: "website",
    siteName: company.name,
    locale: "en_US",
    title: `${company.name}: ${company.tagline}`,
    description: company.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${company.name}: ${company.tagline}`,
    description: company.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

/**
 * The social card drawn by src/app/opengraph-image.tsx, which takes its size and alt text from here. Next.js
 * attaches that file's image only to metadata that sets no `openGraph` of its own, and a page's `openGraph`
 * replaces the root layout's whole object, so pageMetadata names the image on every page.
 */
export const socialImage = {
  url: "/opengraph-image",
  type: "image/png",
  width: 1200,
  height: 630,
  alt: `${company.name}: ${company.tagline}`,
};

type PageMetadataInput = {
  /** Page title; the layout template appends " | SmartxDreams". */
  title: string;
  description: string;
  /** Site path of the page, used as the canonical URL and the Open Graph URL. */
  path: string;
  /** Title on link previews. Defaults to the title with the company name, as the layout template writes it. */
  socialTitle?: string;
};

/** Metadata for one page: title, description, canonical URL, and matching Open Graph and Twitter fields. */
export function pageMetadata({ title, description, path, socialTitle }: PageMetadataInput): Metadata {
  // The layout's title template reaches only <title>, so the card titles are branded here.
  const cardTitle = socialTitle ?? `${title} | ${company.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: company.name,
      locale: "en_US",
      url: path,
      title: cardTitle,
      description,
      images: [socialImage],
    },
    twitter: { card: "summary_large_image", title: cardTitle, description, images: [socialImage] },
  };
}

/**
 * Site path of the logo in the Organization structured data: the charcoal mark, cleaned and centred on a
 * transparent 512 px square by scripts/build-brand.mjs. Search engines show it on white and ask for a square
 * of at least 112 px.
 */
export const organizationLogoPath = "/brand/logo/smartxdreams-mark-on-light-square-512.png";

/** schema.org Organization for SmartxDreams. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: company.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(organizationLogoPath),
    description: company.description,
  };
}

/**
 * The team as schema.org Person entries, each an employee of the Organization. The image is the portrait as
 * the deployed site serves it: the 1024 px WebP variant in the static export (which ships no originals),
 * the original photo on the server build.
 *
 * Illustrative profiles are left out: a stand-in name and portrait must not reach search engines as a
 * statement about a real employee. The list is empty until the first real person is introduced.
 */
export function teamJsonLd(people: readonly Person[] = team): Record<string, unknown>[] {
  return people.filter((person) => !person.illustrative).map((person) => {
    const src = photoBySlot(person.photo.slot).src;
    return {
      "@type": "Person",
      name: person.name,
      jobTitle: person.role,
      image: absoluteUrl(process.env.NEXT_PUBLIC_STATIC_EXPORT === "true" ? imageLoader({ src, width: 1024 }) : src),
      worksFor: { "@id": `${siteUrl}/#organization` },
    };
  });
}

/** schema.org WebSite, linked to the Organization. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: company.name,
    url: absoluteUrl("/"),
    description: company.tagline,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en",
  };
}
