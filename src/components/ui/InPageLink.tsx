"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type InPageLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

/**
 * A link to a section of the page it is on ("#waitlist"). Next.js scrolls to the section, and Lenis eases the
 * scroll, but keyboard focus stays on the link, so the next Tab would carry on from the link instead of from
 * the section. This moves focus to the section as well, without scrolling: the scroll is already under way.
 *
 * It stays a next/link rather than a plain anchor. The browser gives a plain fragment navigation a history
 * entry without the router's state, and Next.js ignores Back or Forward to such an entry from another page,
 * which leaves that other page on screen under this page's address.
 */
export function InPageLink({ href, onClick, ...rest }: InPageLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // A modified click opens the link somewhere else; focus stays where it is here.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!section) return;
    if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  };

  return <Link href={href} onClick={handleClick} {...rest} />;
}
