import { createHmac, timingSafeEqual } from "node:crypto";
import { currentProductSlug } from "@/content/products/retired";

/**
 * Signed waitlist confirmation tokens. Nothing is stored at sign-up: the token itself carries what was
 * agreed, and the HMAC proves it came from us and was not edited. A token is valid for 7 days.
 *
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(secret, payload part)).
 */

export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type WaitlistTokenPayload = {
  /** Email address. */
  e: string;
  /** Product slug. */
  p: string;
  /** Consent wording version shown on the form. */
  cv: string;
  /** When consent was given (ISO 8601). */
  ca: string;
  /** Expiry, ms since epoch. */
  exp: number;
};

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url");
const sign = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest();

export function createToken(secret: string, payload: WaitlistTokenPayload): string {
  const data = encode(JSON.stringify(payload));
  return `${data}.${encode(sign(secret, data))}`;
}

export type TokenCheck =
  { valid: true; payload: WaitlistTokenPayload } | { valid: false; reason: "malformed" | "bad-signature" | "expired" };

export function verifyToken(secret: string, token: string, now = Date.now()): TokenCheck {
  const [data, signature, extra] = token.split(".");
  if (!data || !signature || extra !== undefined) return { valid: false, reason: "malformed" };
  const expected = sign(secret, data);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { valid: false, reason: "bad-signature" };
  let payload: WaitlistTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as WaitlistTokenPayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (typeof payload.exp !== "number" || payload.exp < now) return { valid: false, reason: "expired" };
  // A link emailed before a product was renamed carries its old slug; the signature covers that slug, so
  // the token stays valid and is confirmed for the product under its current slug.
  return { valid: true, payload: { ...payload, p: currentProductSlug(payload.p) } };
}
