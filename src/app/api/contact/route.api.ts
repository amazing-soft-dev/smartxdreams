import { emailUnavailable, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { contactRequestSchema } from "@/lib/api/schemas";
import { spamVerdict } from "@/lib/api/spam";

/** Server only: email needs secrets and network access. Never cached. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Five messages per IP in ten minutes is plenty for a person and slows a script down. */
const LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/**
 * POST /api/contact: the contact form. Validates the message, filters bots, and (next commits) emails the
 * team and sends the sender an acknowledgement. Response format: docs/api.md.
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`contact:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, contactRequestSchema);
  if ("response" in parsed) return parsed.response;

  // Bots get the same answer as people, and nothing is sent.
  if (spamVerdict(parsed.data)) return ok();

  // Sending lands in the next commit; until then nothing is delivered, so say so.
  return emailUnavailable();
}
