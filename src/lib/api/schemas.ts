import { z } from "zod";
import { currentProductSlug } from "@/content/products/retired";
import { productSlugs } from "@/content/selectors";
import { contactSchema } from "@/lib/forms/contact";
import { waitlistConsent, waitlistSchema } from "@/lib/forms/waitlist";

/**
 * Request bodies the API accepts. Each extends the form's own schema (so the browser and the server give
 * the same field messages) with the spam-guard fields every form sends and server-only checks.
 */

/** The longest time-on-form the API records: 24 hours. */
const MAX_ELAPSED_MS = 86_400_000;

/**
 * Sent by every form: a honeypot people never see, and how long the form was open before sending. A tab can
 * stay open for days and a device clock can move backwards, so the time is clamped into 0 to 24 hours rather
 * than refused: the form has no field to show that error on.
 */
export const spamGuardSchema = z.object({
  website: z.string().max(500).optional().default(""),
  elapsedMs: z
    .number()
    .int()
    .transform((ms) => Math.min(Math.max(ms, 0), MAX_ELAPSED_MS))
    .optional(),
});

/**
 * A product the site offers, by its slug now or by the slug it had before a rename: a page cached before
 * the rename still sends the old one. Requests are normalised to the current slug.
 */
const knownProduct = (slug: string | undefined) => slug === undefined || productSlugs().includes(currentProductSlug(slug));
const currentProduct = <T extends { product?: string }>(data: T): T =>
  data.product === undefined ? data : { ...data, product: currentProductSlug(data.product) };

export const contactRequestSchema = contactSchema
  .refine((data) => knownProduct(data.product), { path: ["product"], error: "Choose a product from the list." })
  .transform(currentProduct)
  .and(spamGuardSchema);

export const waitlistRequestSchema = waitlistSchema
  .extend({
    /** The consent wording version the form showed. Must be the current one. */
    consentVersion: z.literal(waitlistConsent.version, { error: "Reload the page: the sign-up wording has changed." }),
  })
  .refine((data) => knownProduct(data.product), { path: ["product"], error: "Choose a product." })
  .transform(currentProduct)
  .and(spamGuardSchema);

export type ContactRequest = z.infer<typeof contactRequestSchema>;
