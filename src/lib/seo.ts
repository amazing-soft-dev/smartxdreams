import type { Metadata } from "next";
import { company } from "@/content/site";
import { publicEnv } from "./env";

/** Canonical origin without a trailing slash, from NEXT_PUBLIC_SITE_URL. */
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;

/** Absolute URL for a site path: absoluteUrl("/about") -> "https://www.example.com/about". */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}

/** Site-wide defaults, set once in the root layout. Pages override title, description and canonical. */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${company.name}: ${company.tagline}`,
    template: `%s | ${company.name}`,
  },
  description: company.description,
  applicationName: company.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: company.name,
    locale: "en_US",
    url: "/",
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

type PageMetadataInput = {
  /** Page title; the layout template appends " | SmartxDreams". */
  title: string;
  description: string;
  /** Site path of the page, used as the canonical URL and the Open Graph URL. */
  path: string;
};

/** Metadata for one page: title, description, canonical URL, and matching Open Graph and Twitter fields. */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: company.name, locale: "en_US", url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Site path of the logo in the Organization structured data: the light-background symbol (1024 px
 * square PNG), because search engines show it on white.
 */
export const organizationLogoPath = "/brand/smartxdreams-symbol-light-bg.png";

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
