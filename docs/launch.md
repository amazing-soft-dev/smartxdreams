# Launch checklist

Everything needed to put SmartxDreams live on Vercel and keep an eye on it afterwards. Work through the
sections in order. Items that need a person outside engineering (legal, content) are listed at the end.

## 1. Vercel project and environment variables

The `main` branch deploys to production on Vercel (docs/pipeline.md). Vercel runs the **server build**
(`npm run build`), which includes the API routes, the proxy, the security headers and the redirects.

1. **Node.js version:** Project Settings → General → Node.js Version. Use the current LTS, matching CI
   (`lts/*`).
2. **Environment variables:** Project Settings → Environment Variables. Set them for **Production**, and
   for **Preview** too if you want working forms on preview deployments; use a separate Resend key there.
   Values never go in the repository; `.env.example` lists them with examples.

| Variable | Required | Example | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://www.example.com` | Canonical URLs, sitemap, RSS, Open Graph, links in waitlist emails. No trailing slash. It is inlined at build time, so **redeploy after changing it**. |
| `RESEND_API_KEY` | Yes, for forms | `re_…` (from Resend → API Keys, "Sending access" for this domain only) | Sending contact and waitlist email |
| `CONTACT_FROM_EMAIL` | Yes, for forms | `SmartxDreams <hello@example.com>` | Sender; must be on the verified Resend domain |
| `CONTACT_TO_EMAIL` | Yes, for forms | `team@example.com` | Team inbox for contact messages and waitlist consent records |
| `WAITLIST_SECRET` | Yes, for the waitlist | 64 hex characters from `openssl rand -hex 32` | Signs waitlist confirmation links. Rotating it invalidates unused links. |
| `RESEND_WAITLIST_SEGMENT_ID` | No | `seg_…` | Adds confirmed waitlist contacts to a Resend segment |
| `VERCEL_ENV` | Set by Vercel | `production` | Turns on Analytics and Speed Insights; hides draft blog posts in production only |

Without the Resend variables the site still works, but both forms answer "We cannot send email right
now" (503), and the server logs say which settings are missing.

3. **Analytics:** Project → Analytics → enable **Web Analytics** and **Speed Insights**. They run only on
   the production deployment and use no cookies (see the privacy policy).

## 2. Resend sender domain

The site sends four kinds of email: contact notifications to the team, contact acknowledgements, waitlist
confirmation links, and consent records to the team. All come from `CONTACT_FROM_EMAIL`.

1. In Resend → **Domains → Add domain**, add the sending domain, for example `example.com`, or a
   subdomain such as `mail.example.com` to keep its reputation separate. Pick the region closest to
   your users.
2. Add the DNS records Resend shows, exactly as shown, at your DNS provider. Typically:
   - an **MX** and a **TXT (SPF)** record on the `send` subdomain, for bounces;
   - a **TXT (DKIM)** record at `resend._domainkey`;
   - optionally a **TXT (DMARC)** record at `_dmarc`. Start with `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain`
     and tighten to `quarantine` once reports look clean.
3. Press **Verify** in Resend and wait until the domain shows **Verified**. DNS can take up to a few hours.
4. Create the API key (sending access, this domain only) and set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`
   on Vercel. Redeploy.
5. Test on the deployed site, with real addresses you control:
   - Contact form: the team inbox gets "[Contact] …" with Reply-To set to the sender; the sender gets
     "We got your message".
   - Waitlist: the confirmation email arrives; its link opens `/waitlist/confirm` on the real domain;
     pressing Confirm shows "You are on the … waitlist"; the team inbox gets "[Waitlist] Confirmed: …".
   - Check that none of these land in spam (Gmail and Outlook), and that SPF and DKIM show "pass" in the
     message headers.

## 3. DNS and domain

1. **Choose the canonical host.** `www.example.com` or `example.com`; pick one and use it everywhere.
2. **Add both hosts in Vercel** (Project Settings → Domains): the canonical one, and the other set to
   **redirect (308)** to it.
3. **Point DNS at Vercel** with the records Vercel shows for each host: an `A` record for the apex, or
   `ALIAS`/`ANAME` if your provider supports it, and a `CNAME` for `www`. Remove old `A`/`AAAA` records for
   those hosts. Lower the TTL a day ahead if you are moving from another host.
4. **HTTPS:** Vercel issues and renews the certificate once DNS resolves. The site already sends
   `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Do not add `preload` or submit the
   domain to the HSTS preload list until every subdomain serves HTTPS.
5. **Set `NEXT_PUBLIC_SITE_URL`** to the canonical origin, for example `https://www.example.com`, and
   **redeploy**.
6. **Check the live site:**
   - `https://<domain>/` loads over HTTPS; the other host and `http://` redirect to the canonical origin;
     `/About` redirects to `/about` (308).
   - The page source shows `<link rel="canonical">`, `og:url`, and JSON-LD URLs on the canonical origin.
   - `/sitemap.xml`, `/robots.txt` (with the sitemap line), `/llms.txt` and `/blog/rss.xml` use the
     canonical origin.
   - The response headers include `Content-Security-Policy`, `X-Frame-Options: DENY` and
     `Referrer-Policy`, and no `X-Powered-By`.
   - A waitlist confirmation email links to the canonical origin.
7. **Search engines:** verify the domain in Google Search Console and Bing Webmaster Tools (a DNS TXT
   record), then submit `https://<domain>/sitemap.xml`.
8. **Email DNS sanity:** if the root domain does not send email, publish `v=spf1 -all` on it, and keep a
   DMARC record (section 2) so nobody can send as the domain.

### If you host the static export instead

`NEXT_OUTPUT=export npm run build` writes a plain site to `out/`. It has **no API routes**: the forms show
that they cannot send. It also has no proxy and no redirects, and the host must add the security headers
itself. Copy the headers from `src/lib/security-headers.ts` into the host's configuration (for example a
`_headers` file) and add a lowercase redirect rule there too.
