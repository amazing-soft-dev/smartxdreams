import type { Product } from "../types";

export const acorn: Product = {
  slug: "acorn",
  name: "Acorn",
  tagline: "Your browser fills the application. You press submit.",
  summary:
    "Acorn is a browser extension that fills job application forms from your resume and profile, field by field, and stops for you to review every answer before anything is sent.",
  audience: "job-seekers",
  status: "waitlist",
  problem:
    "Every application asks for the same history again in a different form, and a long search turns into hours of copying and pasting.",
  steps: [
    { title: "Add your profile", body: "Upload your resume or enter your work history once." },
    { title: "Open an application", body: "On a job's application page, Acorn fills each field from your experience." },
    {
      title: "Review before you submit",
      body: "Every filled field is highlighted for you to check and change. Nothing is sent until you press submit yourself.",
    },
  ],
  promise: {
    title: "Nothing is sent until you press submit.",
    body: "Acorn fills, highlights and stops. Reviewing every answer is the core step of the product, not an option you can skip.",
  },
  features: [
    {
      title: "Fills from your real history",
      body: "Answers come from the resume and profile you gave it, matched to each question. If a question needs something you have not provided, the field is left for you instead of being guessed.",
    },
    {
      title: "Review first, always",
      body: "Filled fields are highlighted, with the part of your profile each answer came from. You edit anything, then submit.",
    },
    {
      title: "Works on common application forms",
      body: "Built for the application forms most employers use, including multi-page forms with uploads.",
    },
    {
      title: "One profile, many versions",
      body: "Keep a few versions of your summary or cover note and choose which one a form should use.",
    },
  ],
  whoFor: ["Job seekers applying to many roles", "Anyone who retypes the same history into every form"],
  limits: [
    "Acorn never submits an application for you; you always review and press submit.",
    "Some sites block browser extensions or use unusual forms; there you may need to fill fields yourself.",
    "It does not promise interviews or offers, and it does not write experience you do not have.",
  ],
  dataHandling: [
    "Your profile and resume are stored encrypted and used only to fill forms you open.",
    "Acorn reads a page only when you ask it to fill that page.",
    "We never sell your data or share it with employers or job boards.",
    "Delete your profile at any time and it is removed from our systems.",
  ],
  faq: [
    {
      question: "Does Acorn submit applications for me?",
      answer: "No. It fills the form and stops. You review every field and press submit yourself.",
    },
    {
      question: "Which sites does it work on?",
      answer:
        "Application forms on employer and job-board sites, in the browsers the extension supports. Some sites block extensions; on those you fill the form yourself. Acorn is not affiliated with any job board.",
    },
    {
      question: "Will it make up answers?",
      answer:
        "No. Answers come from what you gave it. If a question needs information it does not have, it leaves the field empty and tells you.",
    },
  ],
  disclaimer:
    "You are responsible for the accuracy of every application you submit and for following each site's terms of use.",
  photo: { slot: "product-applypilot" },
  related: ["joined"],
  seo: {
    title: "Acorn: fill job applications from your resume",
    description:
      "A browser extension that fills job application forms from your profile and stops for your review before you submit.",
  },
};
