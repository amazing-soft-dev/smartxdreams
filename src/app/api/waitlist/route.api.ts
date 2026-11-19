import { sendEmail } from "@/lib/api/email";
import { emailUnavailable, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { waitlistRequestSchema } from "@/lib/api/schemas";
import { spamVerdict } from "@/lib/api/spam";
import { waitlistConfig } from "@/lib/api/waitlist-config";
import { forgetSignupEmail, mayEmailSignup, normalizeEmail, recordSignupEmail } from "@/lib/api/waitlist-dedupe";
import { confirmationEmail } from "@/lib/api/waitlist-emails";
import { TOKEN_TTL_MS, createToken } from "@/lib/api/waitlist-token";

/** Server only: email needs secrets and network access. Never cached. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/**
 * POST /api/waitlist: join one product's waitlist, with double opt-in. Nothing is stored here: the
 * person gets an email with a signed link, and only confirming it (POST /api/waitlist/confirm) puts them on
 * the list. The product must be one of the six slugs. A repeat sign-up gets the same answer; see
 * waitlist-dedupe.ts. Response format: docs/api.md.
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`waitlist:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, waitlistRequestSchema);
  if ("response" in parsed) return parsed.response;

  if (spamVerdict(parsed.data)) return ok();

  const config = waitlistConfig();
  if (!config) return emailUnavailable();

  const { product, consentVersion } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  // Already emailed twice today for this product: answer exactly as if we sent another, so the response
  // never reveals a previous sign-up, but do not send it.
  const now = Date.now();
  if (!mayEmailSignup(email, product, now)) return ok();
  // Counted before the send, with nothing awaited since the check, so sign-ups that arrive together cannot
  // all pass it.
  recordSignupEmail(email, product, now);

  const token = createToken(config.secret, {
    e: email,
    p: product,
    cv: consentVersion,
    ca: new Date(now).toISOString(),
    exp: now + TOKEN_TTL_MS,
  });
  const sent = await sendEmail({ to: email, purpose: "waitlist-confirmation", ...confirmationEmail({ product, token }) });
  if (!sent.ok) {
    // Nothing was sent, so nothing counts: a failed send never blocks a retry.
    forgetSignupEmail(email, product, now);
    return emailUnavailable();
  }

  return ok();
}
