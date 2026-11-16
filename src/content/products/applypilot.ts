import type { Product } from "../types";

export const applypilot: Product = {
  slug: "applypilot",
  name: "ApplyPilot",
  tagline: "Your browser fills the application. You press submit.",
  summary:
    "ApplyPilot is a browser extension that fills job application forms from your resume and profile, field by field, and stops for you to review every answer before anything is sent.",
  audience: "job-seekers",
  status: "waitlist",
  problem:
    "Every application asks for the same history again in a different form, and a long search turns into hours of copying and pasting.",
  steps: [
    { title: "Add your profile", body: "Upload your resume or enter your work history once." },
    { title: "Open an application", body: "On a job's application page, ApplyPilot fills each field from your experience." },
    { title: "Review and submit", body: "Check every answer, change anything, then submit yourself." },
  ],
  features: [],
  whoFor: ["Job seekers applying to many roles", "Anyone who retypes the same history into every form"],
  limits: [
    "ApplyPilot never submits an application for you; you always review and press submit.",
    "Some sites block browser extensions or use unusual forms; there you may need to fill fields yourself.",
    "It does not promise interviews or offers.",
  ],
  faq: [],
  disclaimer:
    "You are responsible for the accuracy of every application you submit and for following each site's terms of use.",
  related: ["jobatlas"],
  seo: {
    title: "ApplyPilot: fill job applications from your resume",
    description:
      "A browser extension that fills job application forms from your profile and stops for your review before you submit.",
  },
};
