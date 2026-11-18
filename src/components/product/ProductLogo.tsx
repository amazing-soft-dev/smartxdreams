import type { Product } from "@/content/types";
import { cx } from "@/lib/cx";

/** Square sizes scripts/build-brand.mjs writes for every product (public/products/logos/<slug>-<size>.webp). */
export const PRODUCT_LOGO_SIZES = [48, 96, 192, 384] as const;

/** Path of a product's logo at one of the built sizes. */
export function productLogoSrc(slug: string, size: (typeof PRODUCT_LOGO_SIZES)[number]): string {
  return `/products/logos/${slug}-${size}.webp`;
}

type ProductLogoProps = {
  product: Pick<Product, "slug" | "name" | "logo">;
  /** Rendered size of the square in px (the tile included). */
  size?: number;
  /**
   * On a light tile (the default): several logos are dark or navy and would disappear on ink, so wherever
   * the surface may be dark the logo sits on white, like an app icon. Pass false on light surfaces only.
   */
  tile?: boolean;
  /** Hide from assistive technology when the product's name is right next to the logo. */
  decorative?: boolean;
  /**
   * "lazy" (the default): lists down the page, and menus that are closed when the page loads (the logos load
   * as the menu opens; they are 2 to 3 KB). "eager" only for a logo visible in the first screen, such as the
   * product hero's.
   */
  loading?: "lazy" | "eager";
  className?: string;
};

/** A product's logo, square, at any size: the browser picks the sharpest built file for the screen. */
export function ProductLogo({ product, size = 40, tile = true, decorative = false, loading = "lazy", className }: ProductLogoProps) {
  // The tile's padding is a share of its size, so the logo keeps the same air at every size.
  const inner = tile ? Math.round(size * 0.72) : size;
  const smallest = PRODUCT_LOGO_SIZES.find((s) => s >= inner * 2) ?? 384;
  const img = (
    // A plain <img>: the files are already built at fixed sizes, and the static export has no image loader
    // for them. width and height reserve the box.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={productLogoSrc(product.slug, smallest)}
      srcSet={PRODUCT_LOGO_SIZES.map((s) => `${productLogoSrc(product.slug, s)} ${s}w`).join(", ")}
      sizes={`${inner}px`}
      width={inner}
      height={inner}
      alt={decorative ? "" : product.logo.alt}
      aria-hidden={decorative ? true : undefined}
      loading={loading}
      // An eager logo is fetched early but after the stylesheet and fonts the first paint waits on.
      fetchPriority={loading === "eager" ? "low" : undefined}
      decoding="async"
      draggable={false}
      className={cx("block shrink-0 select-none", !tile && className)}
    />
  );
  if (!tile) return img;
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-white shadow-[0_1px_2px_rgb(15_18_38/0.08)] ring-1 ring-ink/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {img}
    </span>
  );
}
