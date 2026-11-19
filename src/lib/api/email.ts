import { Resend } from "resend";
import { readServerEnv } from "@/lib/env";

/**
 * Email through Resend. Server only.
 *
 * Without RESEND_API_KEY and CONTACT_FROM_EMAIL (local builds, CI, previews without secrets) nothing is
 * sent and callers get { ok: false, reason: "not-configured" }, which routes turn into a clear 503 instead
 * of a crash. Logs never contain addresses or message text: only which step failed and the error's name.
 */

let client: Resend | undefined;

export type EmailTransport = { resend: Resend; from: string; teamInbox: string | undefined };

/**
 * The Resend client, the sender and the team inbox, or null when email is not configured. An invalid setting
 * counts as not configured, so routes answer 503 instead of failing; the log names the setting and what is
 * wrong with it, never its value.
 */
export function emailTransport(): EmailTransport | null {
  const settings = readServerEnv();
  if ("invalid" in settings) {
    console.warn(`[email] not configured: invalid settings: ${settings.invalid}`);
    return null;
  }
  const { env } = settings;
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) return null;
  client ??= new Resend(env.RESEND_API_KEY);
  return { resend: client, from: env.CONTACT_FROM_EMAIL, teamInbox: env.CONTACT_TO_EMAIL };
}

export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body: always sent, and what most of our mail is. */
  text: string;
  html?: string;
  replyTo?: string;
  /** Short label for logs, e.g. "contact-notification". Never personal data. */
  purpose: string;
};

export type SendResult = { ok: true } | { ok: false; reason: "not-configured" | "send-failed" };

export async function sendEmail({ to, subject, text, html, replyTo, purpose }: EmailMessage): Promise<SendResult> {
  const transport = emailTransport();
  if (!transport) return { ok: false, reason: "not-configured" };
  try {
    const { error } = await transport.resend.emails.send({ from: transport.from, to, subject, text, html, replyTo });
    if (error) {
      console.error(`[email] ${purpose}: Resend rejected the message (${error.name})`);
      return { ok: false, reason: "send-failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error(`[email] ${purpose}: request to Resend failed (${error instanceof Error ? error.name : "unknown error"})`);
    return { ok: false, reason: "send-failed" };
  }
}

/** Escapes text for use inside HTML email bodies. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
