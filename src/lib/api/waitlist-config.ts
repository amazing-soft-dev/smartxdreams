import { emailTransport } from "./email";
import { readServerEnv } from "@/lib/env";

/**
 * Everything the waitlist needs to run: Resend (to send the confirmation), WAITLIST_SECRET (to sign it) and
 * the team inbox, CONTACT_TO_EMAIL (where the consent record goes when someone confirms). Without the inbox a
 * confirmation could never be recorded, so no confirmation email is sent that nobody could then confirm.
 * Returns null and logs which settings are missing (never request data) when anything is unset. An invalid
 * setting counts as unset: the log names it and what is wrong with it, never its value.
 */
export function waitlistConfig(): { secret: string } | null {
  const settings = readServerEnv();
  if ("invalid" in settings) {
    console.warn(`[waitlist] not configured: invalid settings: ${settings.invalid}`);
    return null;
  }
  const secret = settings.env.WAITLIST_SECRET;
  const transport = emailTransport();
  if (secret && transport?.teamInbox) return { secret };
  const missing = [
    ...(transport ? [] : ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"]),
    ...(settings.env.CONTACT_TO_EMAIL ? [] : ["CONTACT_TO_EMAIL"]),
    ...(secret ? [] : ["WAITLIST_SECRET"]),
  ];
  console.warn(`[waitlist] not configured: set ${missing.join(", ")}`);
  return null;
}
