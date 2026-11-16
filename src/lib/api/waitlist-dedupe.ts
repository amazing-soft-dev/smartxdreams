import { createHash } from "node:crypto";

/**
 * Duplicate handling for the waitlist, without storing anyone's address:
 * - Sign-up: the same address and product get at most 2 confirmation emails a day. Further attempts get the
 *   same "check your inbox" answer as everyone else, so the response never reveals whether an address has
 *   signed up before, and nobody can flood someone's inbox through the form.
 * - Confirm: the same link confirmed twice (double click, reopened email) succeeds again but is recorded once.
 *
 * Only a successful send is counted, so a failed attempt never blocks a retry. Keys are SHA-256 hashes, so memory never holds a readable address. Memory is per server instance (see
 * rate-limit.ts): a cold start forgets, which at worst means one more confirmation email or record.
 */

const hash = (value: string) => createHash("sha256").update(value).digest("base64url");

/** Lowercased and trimmed: Ann@Example.com and ann@example.com are one sign-up. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const SIGNUP_LIMIT = 2;
const SIGNUP_WINDOW_MS = 24 * 60 * 60_000;
const signups = new Map<string, number[]>();

const signupKey = (email: string, product: string) => hash(`${normalizeEmail(email)}|${product}`);

/** Recent confirmation emails for this address and product, dropping old ones (and empty entries). */
function recentSignups(key: string, now: number): number[] {
  const recent = (signups.get(key) ?? []).filter((t) => now - t < SIGNUP_WINDOW_MS);
  if (recent.length === 0) signups.delete(key);
  else signups.set(key, recent);
  return recent;
}

/** Whether another confirmation email may go to this address for this product today. Does not count it. */
export function mayEmailSignup(email: string, product: string, now = Date.now()): boolean {
  return recentSignups(signupKey(email, product), now).length < SIGNUP_LIMIT;
}

/** Counts a confirmation email once Resend has accepted it, so a failed send never blocks a retry. */
export function recordSignupEmail(email: string, product: string, now = Date.now()): void {
  const key = signupKey(email, product);
  signups.set(key, [...recentSignups(key, now), now]);
}

const recorded = new Map<string, number>();

/** True the first time a token is confirmed on this instance; false for repeats within its lifetime. */
export function firstConfirmation(token: string, expiresAt: number, now = Date.now()): boolean {
  for (const [key, exp] of recorded) if (exp < now) recorded.delete(key);
  const key = hash(token);
  if (recorded.has(key)) return false;
  recorded.set(key, expiresAt);
  return true;
}
