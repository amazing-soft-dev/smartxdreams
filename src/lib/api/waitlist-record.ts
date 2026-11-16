import { serverEnv } from "@/lib/env";
import { emailTransport, sendEmail } from "./email";
import { consentRecordEmail } from "./waitlist-emails";
import type { WaitlistTokenPayload } from "./waitlist-token";

/**
 * Records a confirmed sign-up:
 * 1. Required: the consent record email to the team inbox (CONTACT_TO_EMAIL). Without it the confirmation
 *    fails, so nobody is counted as confirmed without a record of their consent.
 * 2. Optional, best effort: when RESEND_WAITLIST_SEGMENT_ID is set, the address is added to that Resend
 *    segment so launch emails can go to everyone who confirmed. A failure is logged (no address) and does not
 *    undo the confirmation: the record email already holds everything needed to add them by hand.
 */
export async function recordConfirmation(payload: WaitlistTokenPayload, confirmedAt = new Date()): Promise<{ ok: boolean }> {
  const transport = emailTransport();
  if (!transport?.teamInbox) {
    console.warn("[waitlist] cannot record consent: set CONTACT_TO_EMAIL");
    return { ok: false };
  }
  const recorded = await sendEmail({
    to: transport.teamInbox,
    purpose: "waitlist-consent-record",
    ...consentRecordEmail(payload, confirmedAt),
  });
  if (!recorded.ok) return { ok: false };

  const segmentId = serverEnv().RESEND_WAITLIST_SEGMENT_ID;
  if (segmentId) {
    try {
      const { error } = await transport.resend.contacts.create({ email: payload.e, unsubscribed: false, segments: [{ id: segmentId }] });
      if (error) console.warn(`[waitlist] contact sync skipped (${error.name})`);
    } catch (error) {
      console.warn(`[waitlist] contact sync failed (${error instanceof Error ? error.name : "unknown error"})`);
    }
  }
  return { ok: true };
}
