# Legal pages: drafts pending counsel review

`/privacy` and `/terms` are **drafts**. A lawyer has not reviewed them. Each page shows a visible
"Draft for legal review" note with the draft date, which comes from `draftDate` in its content file.

| Page | Content | Rendered by |
|---|---|---|
| `/privacy` | `src/content/legal/privacy.ts` | `src/components/legal/LegalPage.tsx` |
| `/terms` | `src/content/legal/terms.ts` (the product disclaimers come from each product's `disclaimer` field) | same |

The text describes only what the website does today: waitlists, the contact form, Vercel hosting,
Vercel Web Analytics and Speed Insights (production only, cookieless), and Resend for email. It names no
retention periods, entity details or governing law that we have not decided.

## What counsel must confirm before launch

1. **Who we are.** The legal entity's name, registered address and company number, and whether a data
   protection officer or EU/UK representative is required.
2. **Legal bases.** Consent for waitlist emails, and legitimate interest for answering messages and
   security. Confirm both, and whether the waitlist needs double opt-in in our target markets (issue #52
   sends a confirmation email).
3. **International transfers.** Vercel and Resend may process data in the United States. Name the
   transfer mechanism (for example SCCs or the Data Privacy Framework) once the vendor agreements are signed.
4. **Retention.** Turn "until you leave the list or we close it" and "as long as we need them" into
   concrete periods. Confirm the hosting-log period with Vercel.
5. **Analytics.** Confirm that cookieless Vercel Web Analytics and Speed Insights need no consent banner
   in the target markets.
6. **Children.** The age threshold (16 is used now).
7. **Terms.** Governing law and courts, the liability and warranty wording, and how consumer-law
   carve-outs apply in each market.
8. **Product disclaimers.** ApplyPilot (automation of job sites and their terms of service), ToothLedger
   (insurance estimates) and Kinly (not medical, legal or financial advice). Review these alongside the
   product copy audit in issue #59.
9. **Products.** Each product needs its own privacy notice and terms before anyone can use it.

## When the review is done

1. Update the text in `src/content/legal/*.ts`.
2. Remove the draft note from `LegalPage` (or give `LegalDocument` an `approved` date), and show
   "Last updated" instead.
3. Record the reviewer and date here.
