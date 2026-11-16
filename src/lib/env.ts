import { z } from "zod";

/**
 * Environment variables, validated with zod.
 *
 * Public values (NEXT_PUBLIC_*) are inlined at build time and safe in the browser.
 * Server values are read only on the server, through serverEnv(), and never reach the client bundle.
 * Optional values let the static export and local builds work without email credentials; the API
 * routes check for them at request time and answer with a clear error when they are missing.
 */

const publicSchema = z.object({
  /** Canonical origin, used for metadata, the sitemap and Open Graph URLs. No trailing slash. */
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .transform((url) => url.replace(/\/+$/, ""))
    .default("http://localhost:3000"),
});

const serverSchema = z.object({
  /** Resend API key for the contact and waitlist routes. */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** Sender address on the verified Resend domain, e.g. "SmartxDreams <hello@example.com>". */
  CONTACT_FROM_EMAIL: z.string().min(3).optional(),
  /** Team inbox that receives contact form messages. */
  CONTACT_TO_EMAIL: z.email().optional(),
  /** Vercel sets this to production, preview or development. */
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function format(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});
if (!parsedPublic.success) {
  throw new Error(`Invalid public environment variables: ${format(parsedPublic.error)}`);
}

/** Validated public environment. */
export const publicEnv: PublicEnv = parsedPublic.data;

let cachedServerEnv: ServerEnv | undefined;

/** Validated server environment. Throws if called in the browser. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must only be called on the server.");
  }
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL || undefined,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL || undefined,
    VERCEL_ENV: process.env.VERCEL_ENV || undefined,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${format(parsed.error)}`);
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
