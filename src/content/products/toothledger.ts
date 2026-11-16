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
  features: [],
  whoFor: ["Patients facing a dental quote", "Families planning treatment around yearly limits"],
  limits: [
    "Results are estimates based on the documents you upload; your insurer decides what it actually pays.",
    "ToothLedger does not choose treatment for you; talk to your dentist about what you need.",
  ],
  faq: [],
  disclaimer:
    "ToothLedger gives estimates, not insurance, financial or dental advice. Confirm coverage with your insurer before treatment.",
  related: ["kinly"],
  seo: {
    title: "ToothLedger: what your dental treatment will really cost",
    description:
      "Estimate your out-of-pocket dental cost from your quote and plan, see your remaining yearly limit and waiting periods, and compare splitting work across years.",
  },
};
