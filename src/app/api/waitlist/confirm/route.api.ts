import { z } from "zod";
import { emailUnavailable, fail, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { waitlistConfig } from "@/lib/api/waitlist-config";
import { firstConfirmation, forgetConfirmation } from "@/lib/api/waitlist-dedupe";
import { recordConfirmation } from "@/lib/api/waitlist-record";
import { verifyToken } from "@/lib/api/waitlist-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 10, windowMs: 10 * 60_000 };
const bodySchema = z.object({ token: z.string().min(10).max(2_000) });

/**
 * POST /api/waitlist/confirm: the second step of double opt-in. The confirm page posts the token from the
 * email link when the person presses Confirm. A POST, not the link itself, so mail scanners that open links
 * cannot confirm on someone's behalf. A confirmation is recorded with its consent details (waitlist-record.ts).
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`waitlist-confirm:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, bodySchema);
  if ("response" in parsed) return parsed.response;

  const config = waitlistConfig();
  if (!config) return emailUnavailable();

  const check = verifyToken(config.secret, parsed.data.token);
  if (!check.valid) {
    return check.reason === "expired"
      ? fail(410, "expired_token", "This link has expired. Join the waitlist again from the product page to get a new one.")
      : fail(400, "invalid_token", "This link is not valid. Check that you opened the whole link from the email.");
  }

  // Confirming the same link again (double click, reopened email) is still a success, recorded only once.
  if (!firstConfirmation(parsed.data.token, check.payload.exp)) return ok();

  // The consent record must exist before anyone counts as confirmed; if it fails, they can press Confirm again.
  const recorded = await recordConfirmation(check.payload);
  if (!recorded.ok) {
    forgetConfirmation(parsed.data.token);
    return emailUnavailable();
  }

  return ok();
}
