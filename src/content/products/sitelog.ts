import type { Product } from "../types";

export const sitelog: Product = {
  slug: "sitelog",
  name: "SiteLog",
  tagline: "Photos and a voice note in. The day's site report out.",
  summary:
    "SiteLog turns a foreman's site photos and a short voice note into the daily report: weather, crew on site, progress by area and any delays, ready to check and send.",
  audience: "builders",
  status: "waitlist",
  problem:
    "After a long day on site, writing the daily report is the last thing anyone wants to do, so it is late, thin or missing when a dispute comes up.",
  steps: [
    { title: "Capture the day", body: "Take site photos and record a short voice note on your phone." },
    { title: "Get the draft", body: "SiteLog writes the report with weather, crew, progress and delays." },
    { title: "Check and send", body: "Edit anything that is off, then share the report with the office or client." },
  ],
  features: [],
  whoFor: ["Foremen and site supervisors", "Small builders and contractors"],
  limits: [
    "SiteLog drafts the report from what you capture; check it before you send it.",
    "Weather comes from public forecasts for the site's location, not from instruments on site.",
  ],
  faq: [],
  related: ["trustdraft"],
  seo: {
    title: "SiteLog: daily site reports from photos and a voice note",
    description:
      "Turn site photos and a voice note into a daily construction report with weather, crew, progress and delays.",
  },
};
