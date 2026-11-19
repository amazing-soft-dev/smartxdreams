import { productBySlug } from "@/content/selectors";
import { company } from "@/content/site";
import { waitlistConsent } from "@/lib/forms/waitlist";
import { absoluteUrl } from "@/lib/seo";
import type { WaitlistTokenPayload } from "./waitlist-token";

const productName = (slug: string) => productBySlug(slug)?.name ?? slug;

/**
 * The double opt-in email. It goes to the address typed into the form, so it contains only fixed wording,
 * the product name and the link: nothing else from the request. Ignoring it means nothing happens.
 */
export function confirmationEmail({ product, token }: { product: string; token: string }) {
  const name = productName(product);
  const link = absoluteUrl(`/waitlist/confirm?token=${encodeURIComponent(token)}`);
  return {
    subject: `Confirm your place on the ${name} waitlist`,
    text: [
      "Hello,",
      "",
      `Someone, hopefully you, asked to join the ${name} waitlist at ${company.name} with this email address.`,
      "",
      "To confirm, open this link and press the Confirm button:",
      link,
      "",
      "The link works for 7 days. If you did not ask to join, ignore this email: you will not be added to the list.",
      "",
      `The ${company.name} team`,
    ].join("\n"),
  };
}

/**
 * The consent record, sent to the team inbox when someone confirms. It is the durable record of who agreed
 * to what and when: address, product, the consent wording version and its text, when consent was given on
 * the form and when it was confirmed. Keep these emails (or move them to a database) for as long as the
 * person stays on the list.
 */
export function consentRecordEmail(payload: WaitlistTokenPayload, confirmedAt: Date) {
  const name = productName(payload.p);
  const wording =
    payload.cv === waitlistConsent.version
      ? waitlistConsent.text
      : "(an earlier version: see the git history of src/lib/forms/waitlist.ts)";
  return {
    subject: `[Waitlist] Confirmed: ${name}`,
    text: [
      `A waitlist sign-up was confirmed (double opt-in).`,
      "",
      `Email:              ${payload.e}`,
      `Product:            ${name} (${payload.p})`,
      `Consent version:    ${payload.cv}`,
      `Consent wording:    ${wording}`,
      `Consent given at:   ${payload.ca}`,
      `Confirmed at:       ${confirmedAt.toISOString()}`,
      "",
      "Keep this email as the consent record for as long as this person stays on the list.",
    ].join("\n"),
  };
}
