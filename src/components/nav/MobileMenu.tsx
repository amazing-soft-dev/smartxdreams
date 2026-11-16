"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useLenis } from "@/components/motion/SmoothScroll";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { products } from "@/content/products";
import { headerCta, mainNav } from "@/content/site";
import { cx } from "@/lib/cx";

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
  const productsId = useId();
  // Start expanded on product pages, so the current product is visible right away.
  const [productsOpen, setProductsOpen] = useState(() => pathname.startsWith("/products"));

  // Keep the native dialog in step with React state.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Lock page scrolling while the menu is open: stop Lenis and hide the root overflow. The dialog itself
  // scrolls natively (SmoothScroll leaves dialogs alone).
  const lenis = useLenis();
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      root.style.overflow = previous;
      lenis?.start();
    };
  }, [open, lenis]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <dialog
      ref={dialog}
      id={id}
      aria-label="Site menu"
      data-surface="dark"
      // Esc fires "cancel" and then "close"; both paths sync React state through onClose.
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
          <Link href="/" aria-label="SmartxDreams home" onClick={() => onOpenChange(false)} className="inline-flex min-h-11 items-center rounded-md">
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
            {mainNav.map((item) =>
              item.href === "/products" ? (
                <li key={item.href} className="border-b border-white/10">
                  <button
                    type="button"
                    aria-expanded={productsOpen}
                    aria-controls={productsId}
                    onClick={() => setProductsOpen((o) => !o)}
                    className={cx(
                      "flex min-h-14 w-full items-center justify-between text-left text-h4 transition-colors",
                      isCurrent(item.href) ? "text-white" : "text-white/70 hover:text-white",
                    )}
                  >
                    {item.label}
                    <svg
                      viewBox="0 0 16 16"
                      width="18"
                      height="18"
                      aria-hidden="true"
                      className={cx("transition-transform duration-300", productsOpen && "rotate-180")}
                    >
                      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div
                    id={productsId}
                    className={cx(
                      "grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out-quint)]",
                      productsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <ul className="overflow-hidden" inert={!productsOpen}>
                      {products.map((product) => (
                        <li key={product.slug}>
                          <Link
                            href={`/products/${product.slug}`}
                            aria-current={pathname === `/products/${product.slug}` ? "page" : undefined}
                            onClick={() => onOpenChange(false)}
                            className="flex flex-col py-2.5 pl-4"
                          >
                            <span className="text-body-l text-white">{product.name}</span>
                            <span className="text-label text-white/65">{product.tagline}</span>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/products" onClick={() => onOpenChange(false)} className="flex py-3 pl-4 text-label text-violet-300">
                          All products
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              ) : (
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
              ),
            )}
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
