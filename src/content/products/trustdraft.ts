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
  features: [],
  whoFor: ["Small software companies selling to larger customers", "Founders and engineers who own security reviews"],
  limits: [
    "TrustDraft only answers from your documents; it flags questions it cannot support instead of inventing answers.",
    "A person must review and approve every answer before it is sent.",
    "It does not certify compliance or replace an audit.",
  ],
  faq: [],
  related: ["sitelog"],
  seo: {
    title: "TrustDraft: answer security questionnaires from your own policies",
    description:
      "Draft answers to customer security questionnaires from your policy documents, with a source for every answer, flags for unsupported ones and human review.",
  },
};
