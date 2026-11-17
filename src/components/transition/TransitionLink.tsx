"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useTransitionNav } from "./TransitionProvider";

type TransitionLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

/**
 * A Next.js Link that navigates behind the page transition. Opt-in: plain <Link> stays instant.
 * Next.js still prefetches it when it scrolls into view, and navigate() prefetches again on click.
 * Modified clicks (new tab, new window, download), other targets and external URLs keep browser behaviour.
 */
export function TransitionLink({ href, onClick, target, ...rest }: TransitionLinkProps) {
  const { navigate } = useTransitionNav();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target && target !== "_self") return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(href);
  };

  return <Link href={href} target={target} onClick={handleClick} {...rest} />;
}
