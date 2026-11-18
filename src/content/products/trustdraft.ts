import type { Product } from "../types";

export const trustdraft: Product = {
  slug: "trustdraft",
  name: "TrustDraft",
  tagline: "Security questionnaires, drafted from your own policies.",
  summary:
    "A small software company uploads the security questionnaire a customer sent, plus its own policy documents. TrustDraft drafts each answer with the source it came from, flags anything it cannot back up, and a person reviews everything before it goes out.",
  audience: "software-teams",
  status: "waitlist",
  problem:
    "A big customer sends a 300-question security review, the deal waits on it, and the answers are scattered across policies nobody has opened in months.",
  steps: [
    { title: "Upload both sides", body: "Add the customer's questionnaire and your security policies." },
    { title: "Review the drafts", body: "Each answer cites the policy passage it came from; unsupported answers are flagged, not guessed." },
    { title: "Approve and export", body: "A person approves every answer, then exports the questionnaire in its original format." },
  ],
  promise: {
    title: "A person approves every answer before it goes out.",
    body: "TrustDraft drafts from your own documents and shows its sources. Your team reviews, edits and approves each answer; nothing is sent to a customer automatically.",
  },
  features: [
    {
      title: "Answers with their source",
      body: "Every drafted answer links to the policy passage it came from, so a reviewer can check it without hunting through the policy.",
    },
    {
      title: "Flags instead of guesses",
      body: "When your documents do not support an answer, TrustDraft says so and leaves it for a person, rather than writing something plausible.",
    },
    {
      title: "Review and approval",
      body: "Assign questions to the right person, track what is approved and what still needs work, and keep a record of who approved each answer.",
    },
    {
      title: "Keeps the original format",
      body: "Import the questionnaire as it arrived and export the answers back into the same format.",
    },
    {
      title: "Reuses approved answers",
      body: "Approved answers are saved, with their sources, for the next questionnaire that asks the same thing.",
    },
  ],
  whoFor: ["Small software companies selling to larger customers", "Founders and engineers who own security reviews"],
  limits: [
    "TrustDraft only answers from your documents; it flags questions it cannot support instead of inventing answers.",
    "A person must review and approve every answer before it is sent.",
    "It does not certify compliance or replace an audit.",
  ],
  faq: [
    {
      question: "Does TrustDraft make us compliant or certified?",
      answer: "No. It helps you answer questionnaires from the policies you already have. It does not certify anything or replace an audit.",
    },
    {
      question: "What happens when our policies do not cover a question?",
      answer: "The question is flagged as unsupported and left for a person. TrustDraft does not invent answers.",
    },
    {
      question: "Who sees our policy documents?",
      answer: "Only your team. Documents stay in your workspace, are never used to answer another company's questionnaires, and can be deleted at any time.",
    },
  ],
  dataHandling: [
    "Your policies and questionnaires stay in your workspace.",
    "They are never used for another company's answers.",
    "Delete documents or the whole workspace at any time.",
  ],
  photo: { slot: "product-trustdraft" },
  logo: { alt: "TrustDraft logo: a teal figure with raised arms inside a navy arc", tile: { background: "#E3F5FA" } },
  related: ["sitelog"],
  seo: {
    title: "TrustDraft: answer security questionnaires from your own policies",
    description:
      "Draft answers to customer security questionnaires from your policy documents, with a source for every answer, flags for unsupported ones and human review.",
  },
};
