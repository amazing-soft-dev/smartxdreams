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
  /** Signs waitlist confirmation links (HMAC-SHA256). At least 32 random characters, e.g. openssl rand -hex 32. */
  WAITLIST_SECRET: z.string().min(32, "WAITLIST_SECRET must be at least 32 characters").optional(),
  /** Optional Resend segment that confirmed waitlist contacts are added to. */
  RESEND_WAITLIST_SEGMENT_ID: z.string().min(1).optional(),
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

/**
 * Build-time check for the production deployment, called from next.config.ts so a bad setting stops the
 * build instead of shipping. Vercel sets VERCEL_ENV=production only there: local builds, CI, preview
 * deployments and the static export are not checked. Throws one error that names every setting that is
 * wrong, never its value.
 */
export function assertProductionEnv(): void {
  if (process.env.VERCEL_ENV !== "production") return;
  const problems: string[] = [];
  // Unset, the origin falls back to http://localhost:3000, which would go into every canonical URL, the
  // sitemap, the feed and the links in waitlist emails.
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    problems.push("NEXT_PUBLIC_SITE_URL: not set; set it to the site's https origin, for example https://www.example.com");
  } else if (new URL(publicEnv.NEXT_PUBLIC_SITE_URL).protocol !== "https:") {
    problems.push("NEXT_PUBLIC_SITE_URL: must be an https URL");
  }
  if (problems.length > 0) {
    throw new Error(`Invalid environment variables for the production deployment: ${problems.join("; ")}. See docs/launch.md.`);
  }
}

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
    WAITLIST_SECRET: process.env.WAITLIST_SECRET || undefined,
    RESEND_WAITLIST_SEGMENT_ID: process.env.RESEND_WAITLIST_SEGMENT_ID || undefined,
    VERCEL_ENV: process.env.VERCEL_ENV || undefined,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${format(parsed.error)}`);
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
