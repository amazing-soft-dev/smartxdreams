import { z } from "zod";

/**
 * The waitlist form's fields and rules, shared by the form (#53) and POST /api/waitlist (#52).
 * The product is fixed by the page the form is on; the API also checks it is one of the six products.
 */

/**
 * The consent wording shown next to the checkbox. Bump the version whenever the wording changes: the API
 * records which version a person agreed to, with the time.
 */
export const waitlistConsent = {
  version: "2026-11-15",
  text: "Email me about early access to this product. I can leave the list at any time.",
} as const;

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(254, "That email address is too long.")
    .pipe(z.email("Enter an email address like name@example.com.")),
  product: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,40}$/, "Choose a product."),
  consent: z.literal(true, { error: "Tick the box to agree to waitlist emails." }),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type WaitlistField = keyof WaitlistInput;
