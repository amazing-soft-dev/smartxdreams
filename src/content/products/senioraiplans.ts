import type { Product } from "../types";

/**
 * SeniorAIPlans copy is written for older adults: short sentences, everyday words, one idea per sentence
 * (aim: US grade 8 reading level or lower).
 */
export const senioraiplans: Product = {
  slug: "senioraiplans",
  name: "SeniorAIPlans",
  tagline: "A patient helper for bills, letters and paperwork.",
  summary:
    "SeniorAIPlans helps older adults who look after their own health, insurance, money and paperwork. It explains bills and letters in plain words. It keeps your papers in order, warns you about likely scams, and checks in every week.",
  audience: "seniors",
  status: "waitlist",
  problem:
    "Letters from insurers, banks and offices are hard to read. Scams look more real every year. And there is no one at home to ask.",
  steps: [
    { title: "Show SeniorAIPlans a letter", body: "Take a photo of a bill or a letter. Or forward an email." },
    { title: "Hear it in plain words", body: "SeniorAIPlans tells you what it says, what it asks you to do, and by when." },
    {
      title: "Stay on top of things",
      body: "Your papers are kept in order. Likely scams are flagged. SeniorAIPlans checks in with you each week.",
    },
  ],
  features: [
    {
      title: "Bills and letters, explained",
      body: "SeniorAIPlans reads the letter and tells you, in a few short sentences, what it means for you. You can ask follow-up questions in your own words.",
    },
    {
      title: "Scam warnings",
      body: "SeniorAIPlans looks for the signs of common scams, like urgent demands for payment or requests for your card number. It lowers the risk. It cannot catch every scam.",
    },
    {
      title: "Your papers in one place",
      body: "Insurance cards, policies, letters and receipts are kept in folders you can find again, with the dates that matter.",
    },
    {
      title: "A weekly check-in",
      body: "Once a week SeniorAIPlans asks how things are and reminds you of anything due soon, like a renewal or an appointment.",
    },
    {
      title: "Easy to read",
      body: "Large text, strong contrast and simple steps. Nothing to set up beyond your name and email.",
    },
  ],
  whoFor: ["Older adults who manage their own affairs", "People without family nearby to help with paperwork"],
  limits: [
    "SeniorAIPlans explains and organizes. It does not pay bills or sign anything for you.",
    "Scam warnings lower the risk but cannot catch every scam. If something feels wrong, call the company on a number you already trust.",
    "SeniorAIPlans does not replace a doctor, a lawyer or a financial adviser.",
  ],
  promise: {
    title: "SeniorAIPlans never pays, signs or replies for you.",
    body: "It explains and reminds. Every decision stays with you, and you can always ask it to explain again.",
  },
  dataHandling: [
    "Your letters and papers are kept private in your account.",
    "We never sell them or share them with anyone.",
    "You can delete anything, or your whole account, at any time.",
  ],
  faq: [
    {
      question: "Is SeniorAIPlans hard to use?",
      answer: "No. You take a photo of a letter, and SeniorAIPlans explains it in a few short sentences. The text is large and easy to read.",
    },
    {
      question: "Can SeniorAIPlans stop every scam?",
      answer: "No. It warns you about likely scams, which lowers the risk. If a call, text or letter feels wrong, call the company on a number you already trust.",
    },
    {
      question: "Does SeniorAIPlans give medical or legal advice?",
      answer: "No. It explains what letters and bills say. For decisions about your health, money or legal matters, talk to a professional.",
    },
  ],
  disclaimer:
    "SeniorAIPlans is not medical, legal or financial advice, and it does not replace a doctor, lawyer or financial adviser. Check important decisions with a professional or the company involved.",
  readability: "large",
  photo: { slot: "product-kinly" },
  related: ["toothledger"],
  seo: {
    title: "SeniorAIPlans: plain-words help with bills, letters and scams",
    description:
      "A helper for older adults that explains bills and letters in plain words, keeps papers in order, warns about likely scams and checks in every week.",
  },
};
