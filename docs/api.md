# Form API

The site's two endpoints, `POST /api/contact` (#51) and `POST /api/waitlist` (#52), run on the server
build that Vercel deploys. They share the building blocks in `src/lib/api/`.

## Route files and the static export

Route handlers are named **`route.api.ts`**, not `route.ts`. `next.config.ts` adds `"api.ts"` to
`pageExtensions` only for the server build, so the static export (`NEXT_OUTPUT=export`) never sees them:
no `out/api`, and no build error for handlers that need a server. `verify:out` and CI check that `out/api`
does not exist. In the static export, forms say they cannot send (`src/lib/forms/availability.ts`).

## Request

`Content-Type: application/json`, at most 16 KB. Bodies are validated with zod (`src/lib/api/schemas.ts`),
which extends each form's own schema, so the browser and the server give the same field messages.

Every form also sends two spam-guard fields:

| Field | Meaning |
|---|---|
| `website` | Honeypot. Hidden from people and assistive tech; must be empty. |
| `elapsedMs` | Milliseconds from form load to submit. |

## Response

```jsonc
// 200
{ "ok": true }
// 4xx / 5xx
{ "ok": false, "error": { "code": "invalid_input", "message": "Some fields need attention.", "fields": { "email": "Enter an email address like name@example.com." } } }
```

`message` is safe to show as it is; `fields` maps field names to messages shown under each field. Every
response has `Cache-Control: no-store`.

| Status | `code` | When |
|---|---|---|
| 400 | `invalid_input` | Validation failed; see `fields` |
| 400 | `invalid_json` | The body is not JSON |
| 413 | `too_large` | Body over 16 KB |
| 415 | `unsupported_media_type` | Not `application/json` |
| 429 | `rate_limited` | Too many requests from one IP; `Retry-After` says when to retry |
| 503 | `email_unavailable` | Resend is not configured or failed |

## Spam

`spamVerdict()` (`src/lib/api/spam.ts`) flags a filled honeypot, a submit under 2.5 seconds after load, or
a missing timer. Routes answer these with a normal `200 { "ok": true }` and send nothing, so bots get no
signal.

## Rate limit

`rateLimit()` (`src/lib/api/rate-limit.ts`) is a sliding window per IP, kept in memory per server instance.
It stops one client hammering a form; it is not a global quota. The IP comes from `x-forwarded-for` and is
never logged or stored.

## Email

`sendEmail()` (`src/lib/api/email.ts`) sends through Resend. It never throws. Without the variables below it
returns `not-configured`, and routes answer 503. Logs contain only the purpose and the error type, never
addresses or message text.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_FROM_EMAIL` | Sender on the verified Resend domain, e.g. `SmartxDreams <hello@example.com>` |
| `CONTACT_TO_EMAIL` | Team inbox for contact-form messages |

## `POST /api/contact`

`src/app/api/contact/route.api.ts`. Body: the contact form fields (`name`, `email`, `topic`, `product`
optional, `message`) plus the spam-guard fields.

1. Rate limit: 5 per IP per 10 minutes, then 429.
2. Validation, then 400 with field errors, including an unknown product.
3. Honeypot or time trap: `200 { ok: true }`, nothing sent.
4. Email not configured (no `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` or `CONTACT_TO_EMAIL`): 503, and one
   log line naming the missing settings.
5. Notification to `CONTACT_TO_EMAIL`: subject `[Contact] <topic>: <name>`, Reply-To set to the sender, and a
   plain-text body with every field and the time received. If Resend rejects it: 503, so the sender retries.
6. Acknowledgement to the sender. It is best effort and contains nothing the sender typed (only fixed
   wording, topic and product), so the form cannot be used to send someone else a message from our domain.
7. `200 { ok: true }`.

Logs never include names, addresses or message text. `GET` answers 405.

Checked against a temporary route on `next start`: 400 with field errors, 400/415 for bad bodies, a silent
200 for honeypot and too-fast submits, 503 without Resend, and 429 with `Retry-After: 60` on the fourth
request in a minute.
