"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { headerCta } from "@/content/site";
import { cx } from "@/lib/cx";
import { ease } from "@/styles/motion";
import { DesktopNav } from "./DesktopNav";
import { MenuButton } from "./MenuButton";
import { MobileMenu } from "./MobileMenu";
import { useHideOnScroll } from "./useHideOnScroll";
import { useNavTheme } from "./useNavTheme";

/**
 * The fixed site header: logo, navigation and the call to action, on a frosted bar. It slides in once on
 * first load (from 0.001 opacity so it never delays Largest Contentful Paint).
 */
export function Header() {
  const [focusInside, setFocusInside] = useState(false);
  // The menu remembers the page it was opened on, so it closes by itself after any navigation
  // (a link inside it, or the browser back button).
  const pathname = usePathname();
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const setMenuOpen = (next: boolean) => setMenuOpenOn(next ? pathname : null);
  const menuId = useId();
  // Never tuck the header away while keyboard focus is inside it.
  const hidden = useHideOnScroll(focusInside);
  // Match the section behind the header: dark glass on dark heroes, light glass on light sections.
  const theme = useNavTheme();
  const onDark = theme === "dark";
  return (
    <motion.header
      initial={{ y: -120, opacity: 0.001 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: ease.outQuint }}
      className="fixed inset-x-0 top-3 z-50 md:top-5"
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false);
      }}
    >
      <Container
        className={cx(
          // Hide: 0.6 s in-out-cubic. Show again: 0.7 s out-expo (quick start, soft landing).
          "transition-transform",
          hidden
            ? "-translate-y-[calc(100%+40px)] duration-600 ease-[var(--ease-in-out-cubic)]"
            : "translate-y-0 duration-700 ease-[var(--ease-out-expo)]",
        )}
      >
        <div
          data-surface={onDark ? "dark" : "light"}
          className={cx(
            "flex h-15 items-center justify-between gap-4 rounded-[18px] pr-2 pl-4 backdrop-blur-xl md:pl-5",
            "transition-[background-color,color,box-shadow] duration-400 ease-[var(--ease-standard)]",
            onDark ? "bg-ink/70 text-white ring-1 ring-white/10" : "bg-white/75 text-ink shadow-tag ring-1 ring-ink/5",
          )}
        >
          <Link href="/" aria-label="SmartxDreams home" className="inline-flex min-h-11 shrink-0 items-center rounded-md">
            {/* White artwork on dark sections, ink artwork on light ones. */}
            <Logo tone={onDark ? "light" : "dark"} height={26} decorative />
          </Link>
          <DesktopNav theme={theme} />
          <div className="flex items-center gap-2">
            {/* Below 640 px the call to action moves into the menu. */}
            <Button href={headerCta.href} variant={onDark ? "coral" : "ink"} size="sm" className="max-sm:hidden">
              {headerCta.label}
            </Button>
            <MenuButton open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} controls={menuId} theme={theme} />
          </div>
        </div>
      </Container>
      <MobileMenu id={menuId} open={menuOpen} onOpenChange={setMenuOpen} />
    </motion.header>
  );
}
