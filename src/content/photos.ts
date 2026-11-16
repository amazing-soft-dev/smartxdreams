import { z } from "zod";
import data from "./photos.json";

/**
 * Photo registry. Every photo in public/images has exactly one entry here with its credit, and pages use it
 * through <Photo slot="..." /> exactly once (npm run check:images enforces both).
 * Only the Unsplash License and the Pexels License are accepted; see docs/images.md.
 */
export const creditSchema = z.object({
  photographer: z.string().min(1),
  profileUrl: z.url(),
  photoUrl: z.url(),
  source: z.enum(["unsplash", "pexels"]),
  license: z.enum(["Unsplash License", "Pexels License"]),
});

export const photoSchema = z
  .object({
    /** Stable kebab-case id that pages pass to the Photo component, for example home-step-1. */
    slot: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    /** Public path of the master file, under /images. */
    src: z.string().regex(/^\/images\/[a-z0-9/_-]+\.(?:jpe?g|png|webp)$/),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Describes the photo for screen readers. Empty only when decorative. */
    alt: z.string(),
    decorative: z.boolean(),
    /** Average colour, painted while the photo loads. */
    tint: z.string().regex(/^#[0-9a-f]{6}$/i),
    /** Tiny base64 preview for the blur-up placeholder (scripts/photo-meta.mjs). */
    blurDataURL: z.string().startsWith("data:image/"),
    credit: creditSchema,
  })
  .refine((p) => p.decorative || p.alt.trim().length > 0, { message: "Content photos need alt text", path: ["alt"] });

export type Photo = z.infer<typeof photoSchema>;

export const photos: Photo[] = z.object({ photos: z.array(photoSchema) }).parse(data).photos;

/** The registry entry for a slot. Throws, failing the build, when the slot does not exist. */
export function photoBySlot(slot: string): Photo {
  const photo = photos.find((p) => p.slot === slot);
  if (!photo) throw new Error(`Unknown photo slot "${slot}". Add it to src/content/photos.json.`);
  return photo;
}
