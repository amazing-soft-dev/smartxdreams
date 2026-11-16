import { productBySlug } from "@/content/selectors";
import { company } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";

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
      "The link works for 7 days. If you did not ask to join, ignore this email: you will not be added, and we will not email you again about it.",
      "",
      `The ${company.name} team`,
    ].join("\n"),
  };
}
