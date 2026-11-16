import type { Product } from "../types";

export const kinly: Product = {
  slug: "kinly",
  name: "Kinly",
  tagline: "A patient helper for bills, letters and paperwork.",
  summary:
    "Kinly helps older adults who manage their own health, insurance, money and paperwork. It explains bills and letters in plain words, keeps important documents in order, warns about likely scams and checks in every week.",
  audience: "seniors",
  status: "waitlist",
  problem:
    "Letters from insurers, banks and agencies are hard to read, scams look more convincing every year, and there is no one at home to ask.",
  steps: [
    { title: "Show Kinly a letter", body: "Take a photo of a bill or letter, or forward an email." },
    { title: "Hear it in plain words", body: "Kinly explains what it says, what it wants from you and by when." },
    { title: "Stay on top of things", body: "Documents are kept in order, likely scams are flagged, and Kinly checks in each week." },
  ],
  features: [],
  whoFor: ["Older adults managing their own affairs", "People without family nearby to help with paperwork"],
  limits: [
    "Kinly explains and organizes; it does not pay bills or sign anything for you.",
    "Scam warnings lower the risk but cannot catch every scam. If something feels wrong, call the organization on a number you already trust.",
    "Kinly does not replace a doctor, lawyer or financial adviser.",
  ],
  faq: [],
  disclaimer:
    "Kinly is not medical, legal or financial advice. Check important decisions with a professional or the organization involved.",
  related: ["toothledger"],
  seo: {
    title: "Kinly: plain-words help with bills, letters and scams",
    description:
      "An AI helper for seniors that explains bills and letters in plain words, organizes documents, warns about scams and checks in every week.",
  },
};
