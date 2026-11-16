"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { headerCta, mainNav } from "@/content/site";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";

type MobileMenuProps = {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The menu below 1024 px, built on a modal <dialog>. showModal() puts it in the top layer, makes the rest
 * of the page inert (so focus stays inside), and gives Esc-to-close; when it closes, the browser returns
 * focus to the menu button that opened it.
 */
export function MobileMenu({ id, open, onOpenChange }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Keep the native dialog in step with React state.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <dialog
      ref={dialog}
      id={id}
      aria-label="Site menu"
      data-surface="dark"
      onClose={() => onOpenChange(false)}
      className={cx(
        "fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-ink p-0 text-white lg:hidden",
        "opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-400 ease-[var(--ease-out-quint)]",
        "-translate-y-2 open:translate-y-0 open:opacity-100 starting:open:-translate-y-2 starting:open:opacity-0",
        "backdrop:bg-ink/60",
      )}
    >
      <div className="flex min-h-full flex-col px-4 pt-3 pb-8 md:px-10 md:pt-5">
        <div className="flex h-15 items-center justify-between pr-2 pl-4">
          <Link href="/" aria-label="SmartxDreams home" onClick={() => onOpenChange(false)} className="rounded-md">
            <Logo tone="light" height={26} decorative />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => onOpenChange(false)}
            className="relative inline-flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <span aria-hidden className="absolute top-1/2 left-1/2 h-[1.5px] w-[18px] -translate-1/2 rotate-45 rounded-full bg-white" />
            <span aria-hidden className="absolute top-1/2 left-1/2 h-[1.5px] w-[18px] -translate-1/2 -rotate-45 rounded-full bg-white" />
          </button>
        </div>

        <nav aria-label="Main" className="mt-8 px-4">
          <ul className="flex flex-col">
            {mainNav.map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onClick={() => onOpenChange(false)}
                  className={cx(
                    "flex min-h-14 items-center text-h4 transition-colors",
                    isCurrent(item.href) ? "text-white" : "text-white/70 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto px-4 pt-10">
          <Button href={headerCta.href} variant="coral" size="lg" className="w-full justify-between" onClick={() => onOpenChange(false)}>
            {headerCta.label}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
