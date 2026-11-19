import type { z } from "zod";
import { fieldErrors } from "@/lib/forms/contact";
import type { FormFailure, FormSuccess } from "@/lib/forms/response";

/**
 * One JSON shape for every form endpoint (src/lib/forms/response.ts):
 *   success  200  { "ok": true }
 *   failure  4xx/5xx  { "ok": false, "error": { "code", "message", "fields"? } }
 * `message` is a sentence the form can show as it is; `fields` maps field names to messages shown under
 * each field. Responses are never cached.
 */

const noStore = { "Cache-Control": "no-store" };

export function ok(): Response {
  return Response.json({ ok: true } satisfies FormSuccess, { status: 200, headers: noStore });
}

export function fail(
  status: number,
  code: string,
  message: string,
  options: { fields?: Record<string, string>; headers?: Record<string, string> } = {},
): Response {
  const body: FormFailure = { ok: false, error: { code, message, ...(options.fields ? { fields: options.fields } : {}) } };
  return Response.json(body, { status, headers: { ...noStore, ...options.headers } });
}

/** 429 with Retry-After, from rateLimit(). */
export function rateLimited(retryAfterSeconds: number): Response {
  return fail(429, "rate_limited", "Too many attempts. Please wait a minute and try again.", {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

/** 503 when email is not configured or Resend is down: safe to show, nothing about the cause. */
export function emailUnavailable(): Response {
  return fail(503, "email_unavailable", "We cannot send email right now. Please try again later, or come back to this page in a while.");
}

/** Bodies larger than this are refused: the longest real form (a 5,000-character message) is far smaller. */
export const MAX_BODY_BYTES = 16_384;

/**
 * Reads a JSON body and validates it. Returns the parsed data, or the response to send:
 * 415 (not JSON), 413 (too large), 400 invalid_json, or 400 invalid_input with field errors.
 */
export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<{ data: z.infer<S> } | { response: Response }> {
  // The media type itself must be application/json; parameters after ";" (a charset) are allowed.
  const mediaType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { response: fail(415, "unsupported_media_type", "Send the form as JSON.") };
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return { response: fail(413, "too_large", "That message is too long to send.") };
  }
  const raw = await request.text();
  // Bytes, not string length: a character outside ASCII is one or two UTF-16 units but two to four bytes.
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return { response: fail(413, "too_large", "That message is too long to send.") };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { response: fail(400, "invalid_json", "We could not read the form. Please reload the page and try again.") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      response: fail(400, "invalid_input", "Some fields need attention.", {
        fields: fieldErrors<string>(result.error) as Record<string, string>,
      }),
    };
  }
  return { data: result.data };
}
