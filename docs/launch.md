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
