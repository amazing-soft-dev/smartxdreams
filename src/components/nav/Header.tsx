"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { headerCta } from "@/content/site";
import { cx } from "@/lib/cx";
import { ease } from "@/styles/motion";

/**
 * The fixed site header: logo, navigation and the call to action, on a frosted bar. It slides in once on
 * first load (from 0.001 opacity so it never delays Largest Contentful Paint).
 */
export function Header() {
  return (
    <motion.header
      initial={{ y: -120, opacity: 0.001 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: ease.outQuint }}
      className="fixed inset-x-0 top-3 z-50 md:top-5"
    >
      <Container>
        <div
          className={cx(
            "flex h-15 items-center justify-between gap-4 rounded-[18px] pr-2 pl-4 md:pl-5",
            "bg-ink/70 text-white ring-1 ring-white/10 backdrop-blur-xl",
          )}
        >
          <Link href="/" aria-label="SmartxDreams home" className="inline-flex shrink-0 items-center rounded-md">
            <Logo tone="light" height={26} decorative />
          </Link>
          <Button href={headerCta.href} variant="coral" size="sm">
            {headerCta.label}
          </Button>
        </div>
      </Container>
    </motion.header>
  );
}
