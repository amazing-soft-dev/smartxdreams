import type { Product } from "../types";

export const toothledger: Product = {
  slug: "toothledger",
  name: "ToothLedger",
  tagline: "Know what the dentist will actually cost you.",
  summary:
    "Upload your dentist's quote and your dental plan. ToothLedger estimates what you will pay, shows how much of this year's coverage is left, flags waiting periods, and checks whether splitting the work across two calendar years would save money.",
  audience: "patients",
  status: "waitlist",
  problem:
    "A treatment quote lists codes and fees, the plan document lists percentages and limits, and nobody tells you the one number you need: what you will pay.",
  steps: [
    { title: "Upload two documents", body: "Add the dentist's quote and your dental plan document." },
    { title: "See your cost", body: "ToothLedger estimates your share for each item and in total." },
    { title: "Plan the timing", body: "See your remaining yearly limit, any waiting periods, and whether splitting work across two years costs less." },
  ],
  features: [
    {
      title: "Your share, line by line",
      body: "Each item on the quote is matched to your plan: what the plan is likely to pay, what you are likely to pay, and why (coverage percentage, deductible, frequency limits).",
    },
    {
      title: "Yearly limit left",
      body: "See how much of this year's maximum benefit the work would use and what would be left afterwards.",
    },
    {
      title: "Waiting periods flagged",
      body: "If your plan has not covered a type of treatment yet because of a waiting period, the item is flagged with the date it starts being covered.",
    },
    {
      title: "Splitting across two years",
      body: "When work can wait, ToothLedger compares doing it all now with spreading it over two calendar years, so you can ask your dentist whether that is right for you.",
    },
    {
      title: "Questions to ask",
      body: "A short list of questions for your dentist or insurer, based on the items that are uncertain.",
    },
  ],
  whoFor: ["Patients facing a dental quote", "Families planning treatment around yearly limits"],
  limits: [
    "Results are estimates based on the documents you upload; your insurer decides what it actually pays.",
    "ToothLedger does not choose treatment for you; talk to your dentist about what you need.",
    "It cannot promise savings: the split-years comparison shows possible differences, not guaranteed ones.",
  ],
  faq: [
    {
      question: "Is the amount ToothLedger shows what I will pay?",
      answer: "It is an estimate from the documents you upload. Your insurer decides what it pays, so confirm with them before treatment, especially for large or uncertain items.",
    },
    {
      question: "Will splitting work across two years always save money?",
      answer: "No. It depends on your plan limits and on whether the work can safely wait. ToothLedger shows the numbers; whether to wait is a question for your dentist.",
    },
    {
      question: "What happens to my documents?",
      answer: "They are used to make your estimate and kept in your account until you delete them. We never sell them or share them with insurers or dentists.",
    },
  ],
  disclaimer:
    "ToothLedger gives estimates from the documents you upload. It is not insurance, financial or dental advice. Confirm coverage with your insurer before treatment.",
  dataHandling: [
    "Your quote and plan document are used only to make your estimate.",
    "They stay in your account until you delete them.",
    "We never sell them or share them with insurers or dentists.",
  ],
  photo: { slot: "product-toothledger" },
  logo: { alt: "ToothLedger logo: a white tooth on a blue rounded square" },
  related: ["senioraiplans"],
  seo: {
    title: "ToothLedger: what your dental treatment will really cost",
    description:
      "Estimate your out-of-pocket dental cost from your quote and plan, see your remaining yearly limit and waiting periods, and compare splitting work across years.",
  },
};
