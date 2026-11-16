import { emailUnavailable, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { waitlistRequestSchema } from "@/lib/api/schemas";
import { spamVerdict } from "@/lib/api/spam";

/** Server only: email needs secrets and network access. Never cached. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/**
 * POST /api/waitlist: join one product's waitlist. The body names the product by slug, and only the six
 * product slugs are accepted (400 otherwise). Double opt-in, duplicate handling and the consent record
 * follow in the next commits. Response format: docs/api.md.
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`waitlist:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, waitlistRequestSchema);
  if ("response" in parsed) return parsed.response;

  if (spamVerdict(parsed.data)) return ok();

  // The confirmation email lands in the next commit; until then nothing is recorded, so say so.
  return emailUnavailable();
}
