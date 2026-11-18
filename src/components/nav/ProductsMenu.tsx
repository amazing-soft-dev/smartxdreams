"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ProductLogo } from "@/components/product/ProductLogo";
import { products } from "@/content/products";
import { audienceLabel } from "@/content/selectors";
import { cx } from "@/lib/cx";
import type { NavTheme } from "./useNavTheme";

/** Short delay before closing on pointer leave, so the pointer can travel from the button to the panel. */
const CLOSE_GRACE_MS = 140;

type ProductsMenuProps = {
  theme: NavTheme;
};

/**
 * The "Products" mega-menu: a real button (aria-expanded, aria-controls) that opens a frosted panel with
 * the six products in two columns and a preview of the highlighted one. Opens on hover with a short
 * close grace, and on click or keyboard.
 */
export function ProductsMenu({ theme }: ProductsMenuProps) {
  const panelId = useId();
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so it closes by itself after navigating elsewhere.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const [active, setActive] = useState(0);
  const closeTimer = useRef<number | null>(null);
  const current = pathname.startsWith("/products");
  const onDark = theme === "dark";

  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_GRACE_MS);
  };

  useEffect(() => cancelClose, []);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const items = () => Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-item]") ?? []);

  // Keyboard: Arrow Down on the button opens the menu and focuses the first product; arrows move
  // between products (wrapping); Home and End jump; Escape closes and returns focus to the button.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.target === buttonRef.current && event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => items()[0]?.focus());
      return;
    }
    if (index < 0) return;
    const last = list.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (index === last ? 0 : index + 1)
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (index === 0 ? last : index - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    list[next]?.focus();
  };

  const highlighted = products[active] ?? products[0];

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={onKeyDown}
      // Tabbing out of the menu closes it.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") scheduleClose();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cx(
          "inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-label font-medium transition-colors duration-300",
          onDark
            ? current || open
              ? "text-white"
              : "text-white/65 hover:text-white"
            : current || open
              ? "text-ink"
              : "text-ink/65 hover:text-ink",
        )}
      >
        Products
        <svg
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
          className={cx("transition-transform duration-300 ease-[var(--ease-out-quint)]", open && "rotate-180")}
        >
          <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Closed: invisible (out of the tab order and the accessibility tree), faded, raised and blurred. */}
      <div
        id={panelId}
        className={cx(
          "absolute top-[calc(100%+14px)] left-1/2 w-[760px] -translate-x-1/2",
          "transition-[opacity,translate,scale,filter,visibility] duration-300 ease-[var(--ease-out-quint)]",
          open ? "visible scale-100 opacity-100 blur-0" : "pointer-events-none invisible -translate-y-2 scale-98 opacity-0 blur-[6px]",
        )}
      >
        <div
          data-surface="dark"
          className="flex gap-2 rounded-menu bg-[rgb(22_22_30/0.82)] p-2 text-white shadow-menu ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150"
        >
          <ul className="grid w-[460px] grid-cols-2 gap-0.5">
            {products.map((product, index) => (
              <li key={product.slug}>
                <Link
                  href={`/products/${product.slug}`}
                  data-menu-item=""
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className={cx(
                    "flex items-start gap-3 rounded-[14px] px-3.5 py-3 transition-colors duration-250",
                    index === active ? "bg-white/[0.08]" : "hover:bg-white/[0.06]",
                  )}
                >
                  <ProductLogo product={product} size={36} decorative className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-snug font-medium">{product.name}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-white/65">{product.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ProductPreview key={highlighted?.slug} slug={highlighted?.slug ?? ""} />
        </div>
      </div>
    </div>
  );
}

/** The right-hand preview: the highlighted product's audience, summary and a link. Fades in on change. */
function ProductPreview({ slug }: { slug: string }) {
  const product = products.find((p) => p.slug === slug);
  if (!product) return null;
  return (
    <div className="relative flex w-[290px] animate-[menu-preview_500ms_var(--ease-out-quint)] flex-col justify-between overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#6D4AFF_0%,#371D93_55%,#0F1226_100%)] p-5">
      <div>
        <ProductLogo product={product} size={52} decorative className="mb-4" />
        <span className="block text-micro font-semibold tracking-[0.06em] text-white/70 uppercase">
          For {audienceLabel(product.audience).toLowerCase()}
        </span>
        <p className="mt-3 text-[14px] leading-relaxed text-white/85">{product.summary}</p>
      </div>
      <span className="mt-4 text-label font-medium text-white">Join the {product.name} waitlist</span>
    </div>
  );
}
