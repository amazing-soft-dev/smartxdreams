import { emailTransport } from "./email";
import { serverEnv } from "@/lib/env";

/**
 * Everything the waitlist needs to run: Resend (to send the confirmation) and WAITLIST_SECRET (to sign it).
 * Returns null and logs which settings are missing (never request data) when anything is unset.
 */
export function waitlistConfig(): { secret: string } | null {
  const secret = serverEnv().WAITLIST_SECRET;
  const transport = emailTransport();
  if (secret && transport) return { secret };
  const missing = [...(transport ? [] : ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"]), ...(secret ? [] : ["WAITLIST_SECRET"])];
  console.warn(`[waitlist] not configured: set ${missing.join(", ")}`);
  return null;
}
