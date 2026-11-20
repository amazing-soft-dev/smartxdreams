import type { Faq } from "./types";

/** Contact page copy. No reply-time promises: we say a person reads every message, which is true. */
export const contact = {
  hero: {
    title: "Talk to the *people* building it.",
    body: "Questions about a product, an idea for one we should build, or a request about your data: send a message and a person will read it.",
    /** The hero's button, which goes to the form further down the page. */
    cta: "Write a message",
  },
  channels: [
    {
      title: "Ask about a product",
      body: "Choose the product in the form below and ask anything its page does not answer.",
      href: "#contact-form",
      cta: "Write to us",
    },
    {
      title: "Join a waitlist",
      body: "Each product has its own list. We email you when early access opens, and you can leave at any time.",
      href: "/products",
      cta: "Choose a product",
    },
    {
      title: "Your data",
      body: "Ask what we hold about you, or ask us to delete it. Choose “Privacy request” as the topic in the form.",
      href: "/privacy",
      cta: "Read the privacy policy",
    },
  ],
} as const;

/** Contact FAQ: practical questions about getting in touch and what happens to a message. */
export const contactFaq: Faq[] = [
  {
    question: "Who reads my message?",
    answer:
      "A person on the SmartxDreams team. Messages are not answered by an AI model, and we reply from a real inbox to the email address you give us.",
  },
  {
    question: "Can I get early access to a product?",
    answer:
      "Join the product's waitlist. Early access goes to people on the list first. If you have a specific reason to try something sooner, tell us in a message.",
  },
  {
    question: "Can I suggest a product?",
    answer:
      "Yes. Tell us about a task that eats your week and what a good result would look like. Ideas from people who live with the problem shape what we build next.",
  },
  {
    question: "How do I leave a waitlist or delete my details?",
    answer:
      "Every waitlist email has a link to leave the list. To delete everything we hold about you, send a message with “Privacy request” as the topic.",
  },
];
