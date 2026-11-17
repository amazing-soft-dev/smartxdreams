import type { LegalDocument } from "./types";

/**
 * Privacy policy for the website. Draft pending counsel review: see docs/legal.md for the points a lawyer
 * must confirm before launch. It describes only what the site does today (waitlists, contact form, hosting,
 * analytics and email delivery); each product gets its own notice before anyone can use it.
 */
export const privacyPolicy: LegalDocument = {
  title: "Privacy policy",
  summary: "What this website collects, why, who processes it for us, and how to have it deleted.",
  draftDate: "2026-11-15",
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        "This policy covers the SmartxDreams website. SmartxDreams (“we”, “us”) decides how the personal data described here is used.",
        "Our products are not available yet. Each product will have its own privacy notice before anyone can use it.",
        "To contact us about privacy, use the contact form and choose “Privacy request” as the topic.",
      ],
    },
    {
      id: "what-we-collect",
      title: "What we collect",
      blocks: [
        {
          list: [
            "Waitlist: your email address, the product waitlist you joined, when you joined, and your consent to receive early-access emails.",
            "Contact form: your name, your email address, the topic, the product your message is about (if any) and your message.",
            "Technical data: like any website, our hosting provider receives your IP address, browser type and the pages you request. We also use your IP address for a short time to limit how often a form can be sent, which protects against spam.",
          ],
        },
        "Please do not send passwords, payment card numbers, government ID numbers or health information through this website. We do not ask for them.",
      ],
    },
    {
      id: "why-we-use-it",
      title: "Why we use it",
      blocks: [
        {
          list: [
            "To confirm your waitlist sign-up and to email you when early access opens for the product you chose.",
            "To read your message and reply to it.",
            "To keep the website secure and working, and to block spam.",
            "To see, in total, which pages people visit and how fast they load, so we know what to improve.",
          ],
        },
        "We do not sell your data, use it for advertising, or share it with data brokers.",
        "Where data-protection law asks for a legal basis, we rely on your consent for waitlist emails, which you can withdraw at any time, and on our legitimate interest in answering messages and keeping the website secure.",
      ],
    },
    {
      id: "services",
      title: "Services that process data for us",
      blocks: [
        {
          list: [
            "Vercel hosts the website and runs its forms. It processes technical data, such as IP addresses, to deliver pages.",
            "Vercel Web Analytics and Speed Insights count page views and measure page speed. They do not use cookies, and they report totals rather than profiles of individual visitors.",
            "Resend delivers our emails: waitlist confirmations, early-access emails, contact-form notifications and replies. It processes the names, email addresses and message text in those emails.",
          ],
        },
        "These providers may process data outside your country, including in the United States.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      blocks: ["This website does not set cookies, and our analytics works without them."],
    },
    {
      id: "how-long",
      title: "How long we keep it",
      blocks: [
        {
          list: [
            "Waitlist: until you leave the list or we close it.",
            "Contact messages: for as long as we need them to answer you and handle any follow-up. Then we delete them.",
            "Spam-protection data: only as long as needed to apply the sending limit.",
            "Hosting logs: for the period set by our hosting provider.",
          ],
        },
      ],
    },
    {
      id: "your-rights",
      title: "Your choices and rights",
      blocks: [
        {
          list: [
            "Every waitlist email has a link to leave the list.",
            "You can ask us to show, correct or delete the data we hold about you, or object to how we use it. Send a message with “Privacy request” as the topic.",
            "Depending on where you live, you may also have the right to complain to a data-protection authority.",
          ],
        },
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: ["This website is not meant for children under 16, and we do not knowingly collect their data."],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        "When we change this policy, we update this page and its date. If a change affects how we use data you have already given us, we will email you before it takes effect.",
      ],
    },
  ],
};
