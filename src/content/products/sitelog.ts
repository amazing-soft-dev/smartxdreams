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
    {
      title: "Review, edit, then share",
      body: "You read the draft, fix anything that is off and only then share it with the office or client. Nothing goes out without you.",
    },
  ],
  promise: {
    title: "The foreman signs off on every report.",
    body: "SiteLog writes the draft so you do not have to start from a blank page. You check it, change it and decide when it is shared.",
  },
  features: [
    {
      title: "Photos sorted by area",
      body: "Site photos are grouped by the area of work they show, with the time they were taken, ready to attach to the report.",
    },
    {
      title: "Voice note to written notes",
      body: "Talk through the day in your own words. SiteLog turns the note into tidy report sections: crew, progress, deliveries and delays.",
    },
    {
      title: "Weather for the site",
      body: "Conditions for the site location and day come from public forecasts, so the record shows rain or heat that affected the work.",
    },
    {
      title: "Delays recorded as they happen",
      body: "Late deliveries, inspections and weather stoppages are listed with their cause, which matters when a schedule is questioned later.",
    },
    {
      title: "Built for a phone outdoors",
      body: "Large controls and high-contrast text, so the report is readable and editable on a phone in bright sunlight.",
    },
  ],
  whoFor: ["Foremen and site supervisors", "Small builders and contractors"],
  limits: [
    "SiteLog drafts the report from what you capture; check it before you send it.",
    "Weather comes from public forecasts for the site's location, not from instruments on site.",
  ],
  faq: [
    {
      question: "Does SiteLog send the report on its own?",
      answer: "No. It writes a draft. You review and edit it, and you decide when to share it.",
    },
    {
      question: "Where does the weather come from?",
      answer: "From public forecasts for the site location and date. It is a record of conditions, not a measurement taken on site.",
    },
    {
      question: "Who can see the reports?",
      answer: "Only the people you share them with. Reports and photos stay in your account until you delete them.",
    },
  ],
  photo: { slot: "product-sitelog" },
  logo: { alt: "SiteLog logo: a yellow hard hat over the word SiteLog", tile: { background: "#FFF6D1" } },
  related: ["trustdraft"],
  seo: {
    title: "SiteLog: daily site reports from photos and a voice note",
    description:
      "Turn site photos and a voice note into a daily construction report with weather, crew, progress and delays.",
  },
};
