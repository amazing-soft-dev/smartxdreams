import { senderAcknowledgement, teamNotification } from "@/lib/api/contact-emails";
import { emailTransport, sendEmail } from "@/lib/api/email";
import { emailUnavailable, ok, rateLimited, readJson } from "@/lib/api/respond";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { contactRequestSchema } from "@/lib/api/schemas";
import { spamVerdict } from "@/lib/api/spam";
import { firstAcknowledgement, forgetAcknowledgement } from "@/lib/api/waitlist-dedupe";

/** Server only: email needs secrets and network access. Never cached. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Five messages per IP in ten minutes is plenty for a person and slows a script down. */
const LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/**
 * POST /api/contact: the contact form. Validates the message, filters bots and emails it to the team inbox
 * (CONTACT_TO_EMAIL) with the sender as Reply-To, then sends the sender an acknowledgement, at most one per
 * address per day (waitlist-dedupe.ts). Response format: docs/api.md.
 */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`contact:${clientIp(request)}`, LIMIT);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, contactRequestSchema);
  if ("response" in parsed) return parsed.response;

  // Bots get the same answer as people, and nothing is sent.
  if (spamVerdict(parsed.data)) return ok();

  // Without email settings (local builds, CI, previews without secrets) answer a safe 503 instead of failing
  // later. The log names the missing settings, never anything the sender typed.
  const transport = emailTransport();
  const teamInbox = transport?.teamInbox;
  if (!teamInbox) {
    console.warn(
      `[contact] email is not configured: set ${transport ? "CONTACT_TO_EMAIL" : "RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL"}`,
    );
    return emailUnavailable();
  }

  // The message counts as delivered once it reaches the team inbox; if that fails, the sender is told to retry.
  const notified = await sendEmail({ to: teamInbox, purpose: "contact-notification", ...teamNotification(parsed.data, new Date()) });
  if (!notified.ok) return emailUnavailable();

  // Best effort: the team already has the message, so a failed acknowledgement does not fail the request.
  // The reply address is whatever was typed, so it is acknowledged once a day at most: counted before the
  // send, so messages arriving together share one, and uncounted if the send fails.
  if (firstAcknowledgement(parsed.data.email)) {
    const acknowledged = await sendEmail({
      to: parsed.data.email,
      purpose: "contact-acknowledgement",
      ...senderAcknowledgement(parsed.data),
    });
    if (!acknowledged.ok) forgetAcknowledgement(parsed.data.email);
  }

  return ok();
}
