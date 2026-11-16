/**
 * Where the studio is headed. Only "now" items are true today; everything else is labelled "planned" on the
 * page and carries no date, because dates are promises we are not ready to make.
 */
export type RoadmapItem = {
  title: string;
  body: string;
  status: "now" | "planned";
};

export const roadmap: RoadmapItem[] = [
  {
    title: "Waitlists open",
    body: "Every product has a waitlist. Joining tells us which ones to build first.",
    status: "now",
  },
  {
    title: "Private betas",
    body: "Early access for people on each waitlist, one product at a time.",
    status: "planned",
  },
  {
    title: "Public launches",
    body: "Products open to everyone once beta users rely on them every week.",
    status: "planned",
  },
  {
    title: "Published privacy reviews",
    body: "A plain-language write-up of what each product stores, for how long, and why.",
    status: "planned",
  },
];
