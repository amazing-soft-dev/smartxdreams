import { z } from "zod";
import { productSlugs } from "@/content/selectors";
import { contactSchema } from "@/lib/forms/contact";
import { waitlistConsent, waitlistSchema } from "@/lib/forms/waitlist";

/**
 * Request bodies the API accepts. Each extends the form's own schema (so the browser and the server give
 * the same field messages) with the spam-guard fields every form sends and server-only checks.
 */

/** Sent by every form: a honeypot people never see, and how long the form was open before sending. */
export const spamGuardSchema = z.object({
  website: z.string().max(500).optional().default(""),
  elapsedMs: z.number().int().nonnegative().max(86_400_000).optional(),
});

const knownProduct = (slug: string | undefined) => slug === undefined || productSlugs().includes(slug);

export const contactRequestSchema = contactSchema
  .refine((data) => knownProduct(data.product), { path: ["product"], error: "Choose a product from the list." })
  .and(spamGuardSchema);

export const waitlistRequestSchema = waitlistSchema
  .extend({
    /** The consent wording version the form showed. Must be the current one. */
    consentVersion: z.literal(waitlistConsent.version, { error: "Reload the page: the sign-up wording has changed." }),
  })
  .refine((data) => knownProduct(data.product), { path: ["product"], error: "Choose a product." })
  .and(spamGuardSchema);

export type ContactRequest = z.infer<typeof contactRequestSchema>;
export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
