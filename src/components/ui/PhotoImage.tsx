import Image from "next/image";
import { cx } from "@/lib/cx";

/**
 * What an image needs from its registry entry (src/content/photos.json), as plain data. A server component
 * resolves the slot (photoImageData in Photo.tsx) and can hand the result to a client component as a prop.
 */
export type PhotoImageData = {
  src: string;
  width: number;
  height: number;
  /** Empty for a decorative photo. */
  alt: string;
  /** Average colour, painted while the photo loads. */
  tint: string;
  blurDataURL: string;
  /** Where the subject sits, as a CSS object-position. */
  focal?: string;
};

export type PhotoImageProps = {
  photo: PhotoImageData;
  /** The image's rendered width per breakpoint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /**
   * Preload the image and load it eagerly: only for the largest image above the fold. Goes to next/image as
   * `preload`, which replaces its own `priority` prop (deprecated in Next.js 16) and does the same.
   */
  priority?: boolean;
  /** Fill the parent box (which must be positioned and sized) instead of using intrinsic size. */
  fill?: boolean;
  className?: string;
};

/**
 * A registry photo that is already resolved. This module does not import the registry, so client components
 * can render it without shipping every photo's entry (and zod, which validates them) to the browser. Server
 * components use <Photo slot="..." />, which looks the entry up and renders this.
 */
export function PhotoImage({ photo, sizes, priority = false, fill = false, className }: PhotoImageProps) {
  // Cropped (fill) layouts keep the subject in frame using the registry focal point.
  const style = { backgroundColor: photo.tint, objectPosition: photo.focal };
  return fill ? (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      preload={priority}
      placeholder="blur"
      blurDataURL={photo.blurDataURL}
      className={cx("object-cover", className)}
      style={style}
    />
  ) : (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      preload={priority}
      placeholder="blur"
      blurDataURL={photo.blurDataURL}
      className={cx("h-auto w-full", className)}
      style={style}
    />
  );
}
