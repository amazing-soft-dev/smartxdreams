import { sendEmail } from "@/lib/api/email";
import { emailUnavailable, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { waitlistRequestSchema } from "@/lib/api/schemas";
import { spamVerdict } from "@/lib/api/spam";
import { waitlistConfig } from "@/lib/api/waitlist-config";
import { confirmationEmail } from "@/lib/api/waitlist-emails";
import { TOKEN_TTL_MS, createToken } from "@/lib/api/waitlist-token";

/** Server only: email needs secrets and network access. Never cached. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/**
 * POST /api/waitlist: join one product's waitlist, with double opt-in. Nothing is stored here: the
 * person gets an email with a signed link, and only confirming it (POST /api/waitlist/confirm) puts them on
 * the list. The product must be one of the six slugs. Response format: docs/api.md.
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`waitlist:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, waitlistRequestSchema);
  if ("response" in parsed) return parsed.response;

  if (spamVerdict(parsed.data)) return ok();

  const config = waitlistConfig();
  if (!config) return emailUnavailable();

  const { email, product, consentVersion } = parsed.data;
  const now = Date.now();
  const token = createToken(config.secret, {
    e: email,
    p: product,
    cv: consentVersion,
    ca: new Date(now).toISOString(),
    exp: now + TOKEN_TTL_MS,
  });
  const sent = await sendEmail({ to: email, purpose: "waitlist-confirmation", ...confirmationEmail({ product, token }) });
  if (!sent.ok) return emailUnavailable();

  return ok();
}
