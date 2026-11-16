"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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

  const highlighted = products[active] ?? products[0];

  return (
    <div
      className="relative"
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

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-[calc(100%+14px)] left-1/2 w-[760px] -translate-x-1/2"
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
                    "block rounded-[14px] px-3.5 py-3 transition-colors duration-250",
                    index === active ? "bg-white/[0.08]" : "hover:bg-white/[0.06]",
                  )}
                >
                  <span className="block text-[15px] leading-snug font-medium">{product.name}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-white/65">{product.tagline}</span>
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
        <span className="text-micro font-semibold tracking-[0.06em] text-white/70 uppercase">
          For {audienceLabel(product.audience).toLowerCase()}
        </span>
        <p className="mt-3 text-[14px] leading-relaxed text-white/85">{product.summary}</p>
      </div>
      <span className="mt-4 text-label font-medium text-white">Join the {product.name} waitlist</span>
    </div>
  );
}
