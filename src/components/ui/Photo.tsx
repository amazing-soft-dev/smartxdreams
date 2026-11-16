import Image from "next/image";
import { photoBySlot } from "@/content/photos";
import { cx } from "@/lib/cx";

type PhotoProps = {
  /** Registry slot from src/content/photos.json. Each slot is used exactly once on the site. */
  slot: string;
  /** The image's rendered width per breakpoint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /** Load eagerly: only for the largest image above the fold. */
  priority?: boolean;
  /** Fill the parent box (which must be positioned and sized) instead of using intrinsic size. */
  fill?: boolean;
  className?: string;
};

/**
 * A photo from the registry. Renders responsive images (AVIF/WebP from the Next.js optimizer on the server
 * build, pre-built WebP variants in the static export) with the photo's intrinsic width and height, so the
 * browser reserves its space and nothing shifts. A blur preview and the photo's average colour show while it
 * loads. Alt text comes from the registry: empty for decorative photos, required for content photos.
 */
export function Photo({ slot, sizes, priority = false, fill = false, className }: PhotoProps) {
  const photo = photoBySlot(slot);
  const alt = photo.decorative ? "" : photo.alt;
  // Cropped (fill) layouts keep the subject in frame using the registry focal point.
  const style = { backgroundColor: photo.tint, objectPosition: photo.focal };
  return fill ? (
    <Image
      src={photo.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={photo.blurDataURL}
      className={cx("object-cover", className)}
      style={style}
    />
  ) : (
    <Image
      src={photo.src}
      alt={alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={photo.blurDataURL}
      className={cx("h-auto w-full", className)}
      style={style}
    />
  );
}
