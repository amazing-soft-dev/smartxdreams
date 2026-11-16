"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/content/site";
import { cx } from "@/lib/cx";
import type { NavTheme } from "./useNavTheme";

type DesktopNavProps = {
  theme: NavTheme;
};

/** Top-level links in the header, shown from 1024 px up. The current page is marked with aria-current. */
export function DesktopNav({ theme }: DesktopNavProps) {
  const pathname = usePathname();
  const onDark = theme === "dark";
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "inline-flex h-10 items-center rounded-xl px-3.5 text-label font-medium transition-colors duration-300",
                  onDark
                    ? current
                      ? "text-white"
                      : "text-white/65 hover:text-white"
                    : current
                      ? "text-ink"
                      : "text-ink/65 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
