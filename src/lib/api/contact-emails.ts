import { productBySlug } from "@/content/selectors";
import { company } from "@/content/site";
import { contactTopics } from "@/lib/forms/contact";
import type { ContactRequest } from "./schemas";

/**
 * The emails the contact form sends. Plain text only: nothing a sender types can turn into markup or links
 * the mail client renders, and plain text reads well everywhere.
 */

const topicLabel = (id: ContactRequest["topic"]) => contactTopics.find((t) => t.id === id)?.label ?? id;
const productName = (slug: string | undefined) => (slug ? (productBySlug(slug)?.name ?? slug) : "Not about one product");

/** Keeps a one-line header value on one line: no line breaks from the sender can reach a subject. */
const oneLine = (value: string, max = 80) => value.replace(/\s+/g, " ").trim().slice(0, max);

/** The message for the team inbox. Reply-To is the sender, so replying answers them directly. */
export function teamNotification(message: ContactRequest, receivedAt: Date) {
  return {
    subject: `[Contact] ${topicLabel(message.topic)}: ${oneLine(message.name, 60)}`,
    replyTo: message.email,
    text: [
      `New message from the ${company.name} contact form.`,
      "",
      `Name:     ${oneLine(message.name, 200)}`,
      `Email:    ${message.email}`,
      `Topic:    ${topicLabel(message.topic)}`,
      `Product:  ${productName(message.product)}`,
      `Received: ${receivedAt.toISOString()}`,
      "",
      "Message:",
      message.message,
      "",
      "Reply to this email to answer the sender.",
    ].join("\n"),
  };
}

/**
 * The acknowledgement to the sender: confirms the message arrived and promises no reply time (only that a
 * person reads it).
 *
 * It goes to whatever address was typed into the form, so it contains nothing the sender wrote: no name, no
 * message, only fixed wording plus the topic and product chosen from fixed lists. That way the form cannot be
 * used to send someone else a message from our domain.
 */
export function senderAcknowledgement(message: ContactRequest) {
  return {
    subject: `We got your message: ${company.name}`,
    text: [
      "Hello,",
      "",
      `Thanks for writing to ${company.name}. Your message has reached our team, and a person will read it and reply to this address.`,
      "",
      `Topic:   ${topicLabel(message.topic)}`,
      `Product: ${productName(message.product)}`,
      "",
      "If you did not send a message through our contact form, you can ignore this email: there is nothing you need to do.",
      "",
      `The ${company.name} team`,
    ].join("\n"),
  };
}
