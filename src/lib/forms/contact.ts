import { z } from "zod";

/**
 * The contact form's fields and rules. The form validates with this schema before sending, and the
 * /api/contact route validates the same schema again on the server, so both give the same messages.
 */

export const contactTopics = [
  { id: "general", label: "General question" },
  { id: "product", label: "Question about a product" },
  { id: "idea", label: "An idea for a product" },
  { id: "partnership", label: "Partnership" },
  { id: "press", label: "Press" },
  { id: "privacy", label: "Privacy request" },
] as const;

export type ContactTopic = (typeof contactTopics)[number]["id"];

const topicIds = contactTopics.map((t) => t.id) as [ContactTopic, ...ContactTopic[]];

export const contactLimits = { name: 100, messageMin: 10, message: 5000 } as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(contactLimits.name, `Keep your name under ${contactLimits.name} characters.`),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address so we can reply.")
    .pipe(z.email("Enter an email address like name@example.com.")),
  topic: z.enum(topicIds, { error: "Choose a topic." }),
  /** A product slug, or empty for none. The API also checks the slug is a real product. */
  product: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{0,40}$/, "Choose a product from the list.")
    .optional()
    .transform((v) => v || undefined),
  message: z
    .string()
    .trim()
    .min(contactLimits.messageMin, `Write at least ${contactLimits.messageMin} characters so we know how to help.`)
    .max(contactLimits.message, "Keep your message under 5,000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Field order on the page: the first field with an error gets focus. */
export const contactFields: ContactField[] = ["name", "email", "topic", "product", "message"];

/** The first error message for each field, keyed by field name. */
export function fieldErrors<F extends string>(error: z.ZodError): Partial<Record<F, string>> {
  const errors: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) errors[field as F] = issue.message;
  }
  return errors;
}
