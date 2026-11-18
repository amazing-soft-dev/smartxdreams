# Copy and compliance review

Review of every product page's claims, the disclaimers and the no-fabrication rules (issue #59,
2026-11-16). This is an engineering and editorial review, **not legal advice**. The items marked
**Counsel** must be confirmed by a lawyer before launch, together with the legal pages (docs/legal.md).

How to read the status column:

- **OK**: true as written, or plainly described as how the product will work.
- **Launch**: a commitment about how the product will behave. It must be true when the product ships;
  engineering signs it off at release.
- **Counsel**: needs legal review before launch.
- **Fixed**: changed during this review.

Site-wide: every product page says the product is in development, offers only a waitlist, and labels its
hero screen "Illustrative screen. <Product> is in development." (added in this review).

## 1. Claims audit per product page

### Joined (job seekers)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Gathers openings from LinkedIn, Indeed, Jobright, Dice and company career pages | Capability, named sources | **Counsel** | Naming sites implies access to their listings. Several boards' terms restrict automated collection, and there is no partnership or API agreement yet. Before launch, either confirm lawful access (API, feed or licence) per source, or change the copy to "major job boards". Names are plain text only, never logos. |
| Duplicates merged, with links to every place a role was posted | Capability | Launch | |
| When a job was posted and last confirmed open | Capability | Launch | |
| Company size, funding stage, public reviews | Capability, third-party data | **Counsel** | Review data usually comes under licence; confirm the source and its terms. |
| Saved searches send one email when new jobs match, "nothing else" | Commitment | Launch | Must match the email settings at launch. |
| "Many listings are stale" (problem statement) | Description | Fixed | Was "half the listings are stale", an unsourced figure. |
| Limits: not every site covered; links to the original posting; listings can change | Limit | OK | |

### Acorn (job seekers)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Browser extension that fills application forms from your resume and profile | Capability | **Counsel** | Automated form filling on job sites can conflict with a site's terms of use. The copy says Acorn fills forms you review and submit yourself, and never submits for you. Counsel should confirm this is acceptable for the target sites and markets. |
| "Nothing is sent until you press submit" / "never submits an application for you" | Commitment | Launch | The core promise; must be enforced in the product, not only in settings. |
| Fills from your real history; leaves unknown fields empty instead of inventing | Commitment | Launch | |
| "Works on common application forms", including multi-page forms with uploads | Capability | Launch | Limits already say some sites block extensions. |
| "Your profile and resume are stored encrypted" | Data commitment | Launch | Engineering must confirm encryption at rest (and in transit) at release. |
| "Reads a page only when you ask it to fill that page" | Data commitment | Launch | Extension permissions must match (no broad host access running in the background). |
| Never sells data or shares it with employers or job boards; deletion removes the profile | Data commitment | Launch | Consistent with the privacy policy. |
| Disclaimer: you are responsible for accuracy and for each site's terms | Disclaimer | OK | See section 2. |

### SiteLog (builders)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Turns site photos and a voice note into a daily report (weather, crew, progress, delays) | Capability | Launch | |
| "The foreman signs off on every report"; nothing goes out without you | Commitment | Launch | |
| Weather from public forecasts, not on-site instruments | Limit | OK | Stated as a limit, so the record is not mistaken for measured data. |
| Delays recorded with their cause, "which matters when a schedule is questioned later" | Description | OK | Says why records matter; does not promise any outcome in a dispute. |
| Built for a phone outdoors: large controls, high-contrast text | Capability | Launch | |

### ToothLedger (patients)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Estimates what you will pay, line by line, from your quote and plan | Capability | OK | Always called an estimate; the insurer decides what it pays. |
| Remaining yearly limit; waiting periods flagged with dates | Capability | Launch | Depends on reading the plan document correctly; the disclaimer covers errors. |
| Compares doing work in one year or two | Capability | OK | "It cannot promise savings", and the timing question goes to the dentist. |
| Mockup amounts ($1,570, $1,150 …) | Illustration | OK | Round, invented example figures on a screen labelled illustrative. |
| Not insurance, financial or dental advice | Disclaimer | OK, **Counsel** | Health-adjacent. Counsel should confirm wording for the target markets (insurance and dental regulation). |
| Documents used only for the estimate; never shared with insurers or dentists | Data commitment | Launch | Dental plans and quotes are health-related data in some jurisdictions; see docs/legal.md. |

### SeniorAIPlans (seniors)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Explains bills and letters in plain words | Capability | Launch | |
| Scam warnings "lower the risk"; "cannot catch every scam" | Capability with limit | OK | Never presented as protection. Every mention says what to do when unsure: call the company on a number you already trust. |
| Papers kept in order; weekly check-in | Capability | Launch | |
| "Never pays, signs or replies for you" | Commitment | Launch | |
| "Scams look more real every year" (problem statement) | General statement | OK | A general observation, not a figure; no statistic is implied. |
| Not medical, legal or financial advice | Disclaimer | OK, **Counsel** | Vulnerable audience. Counsel should review the onboarding copy before launch. |
| Data kept private; never sold or shared; delete any time | Data commitment | Launch | |

### TrustDraft (software teams)

| Claim | Type | Status | Notes |
|---|---|---|---|
| Drafts answers only from your documents and shows the source passage | Capability | Launch | |
| Flags unsupported questions instead of guessing | Commitment | Launch | The key promise; must hold in the product. |
| "A person approves every answer"; nothing sent automatically | Commitment | Launch | |
| Reviewer can check a source "without hunting through the policy" | Description | Fixed | Was "in seconds", a speed claim with nothing behind it. |
| Keeps the original questionnaire format on import and export | Capability | Launch | |
| "A 300-question security review" (problem statement) | Example | OK | A scenario size, not a statistic about customers. |
| Does not certify compliance or replace an audit | Limit | OK | |
| Documents never used for another company's answers | Data commitment | Launch | Engineering must confirm tenant isolation, including for any model fine-tuning or caching. |

## Company-level copy

| Claim | Status | Notes |
|---|---|---|
| "A person stays in charge", "Answers show their source", "Your data stays yours" | Launch | Principles; each product's commitments above implement them. |
| "We never sell your data" (Home FAQ, product pages) | Launch | Consistent with the privacy policy. |
| Stats section | OK | All values are null, so the section is hidden until a sourced number exists (src/content/stats.ts). |
| Roadmap | OK | Only "Waitlists open" is marked "Now"; the rest is "Planned", with no dates. |

## 2. Disclaimers verified

Each rule from the plan's copy and safety rules, checked against the copy on 2026-11-16. Where a disclaimer
is shown: product pages show it **in the hero** (beside the product's promise) and again in the "honest
limits" section; the Terms page lists every product disclaimer under "Our products are not professional
advice", read from the same field, so the wording cannot drift.

| Rule | Where it is met | Result |
|---|---|---|
| Acorn: the user always reviews before anything is submitted | Promise "Nothing is sent until you press submit"; limit "never submits an application for you"; feature "Review first, always"; blog post "check before you submit" | Pass |
| Acorn: no "100% automatic", no interview outcomes | No such wording anywhere; limit "It does not promise interviews or offers, and it does not write experience you do not have" | Pass |
| ToothLedger: an estimate, not a guarantee of coverage | Every mention says "estimate"; limits "your insurer decides what it actually pays" and "cannot promise savings"; mockup "Not a guarantee" | Pass |
| ToothLedger: not insurance, financial or dental advice | Disclaimer in the hero, limits, Terms; blog post says "general information, not advice" | Pass |
| SeniorAIPlans: scam detection reduces risk but is not a guarantee | Feature, limit and FAQ all say "cannot catch every scam" and what to do instead | Pass |
| SeniorAIPlans: does not replace medical, legal or financial professionals | Disclaimer in the hero and limits; FAQ "Does SeniorAIPlans give medical or legal advice? No." | Pass |
| SeniorAIPlans: large type, high contrast, plain language | `readability: "large"` sets larger type and full-strength text on the page (at least 16:1); copy written at about US grade 5 | Pass |
| TrustDraft: AI drafts, a person approves everything | Promise "A person approves every answer before it goes out"; limit; mockup "Export is locked until every answer is approved" | Pass |
| TrustDraft: unsupported answers flagged, never invented | Feature "Flags instead of guesses"; limit "flags questions it cannot support instead of inventing answers" | Pass |
| Job sources: brand names as text only, with the trademark note | Joined names sources as plain text; the trademark note is in the Joined footnote and in the site footer on every page; no third-party logos anywhere | Pass (wording itself flagged for Counsel in section 1) |
| Not-advice wording on the blog | The dental and scam posts say they are general information and point to a professional or the company involved | Pass |

## 3. No-fabrication checklist

Signed off for the site as of 2026-11-16 (engineering review; re-run before launch and whenever copy
changes). Each line was checked in `src/content`, `src/components` and the blog posts.

- [x] **No invented statistics.** No percentages, user counts, time saved or results. The stats section is
  hidden until `src/content/stats.ts` has a sourced value (all null). The one figure found, Joined's
  "half the listings are stale", was removed.
- [x] **No testimonials or quotes.** No customer, partner or press quotes anywhere, including the blog.
- [x] **No logos of other companies.** Third-party names (LinkedIn, Indeed, Jobright, Dice, Vercel, Resend,
  Unsplash, Pexels) appear as plain text only. The trademark note is in the footer of every page and in the
  Joined footnote. Photos were checked for visible logos (docs/images.md).
- [x] **No invented people.** The About page names no team members; team profiles appear when real people
  are introduced. The blog is signed "the SmartxDreams team".
- [x] **No implied endorsements.** No "as seen in", "trusted by", partner badges or awards. Photos show no
  identifiable faces on the sensitive pages, so nobody appears to use or endorse a product.
- [x] **Product screens are illustrations.** Every product hero mockup is captioned "Illustrative screen.
  <Product> is in development." Mockup data is invented and generic: round amounts, placeholder companies
  (Northwind, Acme Labs, Bluebird, Harbor & Co) and one placeholder initial ("M. Chen"). Before launch,
  check that none of the placeholder company names reads as a real employer in the target markets.
- [x] **No availability claims.** Every product is "in development" with a waitlist. The roadmap gives no
  dates, and only "Waitlists open" is marked as happening now.
- [x] **Limits stated.** Every product page lists what the product does not do, next to what it does.
- [x] **Seed blog posts.** Six of the seven posts are drafts (noindex, out of the sitemap and feed, hidden
  on the production deployment) until someone reviews them.

## For counsel: items to review before launch

1. **Joined sources.** Naming LinkedIn, Indeed, Jobright and Dice, and the company review data. Confirm
   lawful access per source, or change the copy to "major job boards".
2. **Acorn automation.** Filling application forms on third-party job sites, with the user reviewing
   and submitting. Confirm against those sites' terms for the target markets.
3. **ToothLedger and SeniorAIPlans disclaimers.** Health, insurance and financial-adjacent wording, with SeniorAIPlans
   aimed at older adults.
4. **Data commitments** on the product pages ("never sold", "stored encrypted", "deleted on request") must
   match the privacy policy and the products at launch; see docs/legal.md.
