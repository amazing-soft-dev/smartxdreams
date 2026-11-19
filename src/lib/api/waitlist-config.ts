import { emailTransport } from "./email";
import { readServerEnv } from "@/lib/env";

/**
 * Everything the waitlist needs to run: Resend (to send the confirmation) and WAITLIST_SECRET (to sign it).
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
  if (secret && transport) return { secret };
  const missing = [...(transport ? [] : ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"]), ...(secret ? [] : ["WAITLIST_SECRET"])];
  console.warn(`[waitlist] not configured: set ${missing.join(", ")}`);
  return null;
}
