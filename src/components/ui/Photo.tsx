import { photoBySlot } from "@/content/photos";
import { PhotoImage, type PhotoImageData, type PhotoImageProps } from "./PhotoImage";

type PhotoProps = Omit<PhotoImageProps, "photo"> & {
  /** Registry slot from src/content/photos.json. Each slot is used exactly once on the site. */
  slot: string;
};

/**
 * The registry entry for a slot, cut down to what the image needs. For server components only: importing
 * this module brings in the whole registry. A client component takes the result as a prop and renders
 * <PhotoImage>.
 */
export function photoImageData(slot: string): PhotoImageData {
  const photo = photoBySlot(slot);
  return {
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt: photo.decorative ? "" : photo.alt,
    tint: photo.tint,
    blurDataURL: photo.blurDataURL,
    focal: photo.focal,
  };
}

/**
 * A photo from the registry. Renders responsive images (AVIF/WebP from the Next.js optimizer on the server
 * build, pre-built WebP variants in the static export) with the photo's intrinsic width and height, so the
 * browser reserves its space and nothing shifts. A blur preview and the photo's average colour show while it
 * loads. Alt text comes from the registry: empty for decorative photos, required for content photos.
 */
export function Photo({ slot, ...rest }: PhotoProps) {
  return <PhotoImage photo={photoImageData(slot)} {...rest} />;
}
