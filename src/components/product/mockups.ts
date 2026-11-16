import type { ComponentType } from "react";
import {
  AutofillCard,
  BillExplainerCard,
  CostBarCard,
  JobFeedCard,
  QuestionnaireCard,
  SiteReportCard,
} from "@/components/mockups/HeroCards";

/** The mockup shown in each product's hero. Product page issues can swap in larger, dedicated mockups. */
export const productMockups: Record<string, ComponentType<{ className?: string }>> = {
  jobatlas: JobFeedCard,
  applypilot: AutofillCard,
  sitelog: SiteReportCard,
  toothledger: CostBarCard,
  kinly: BillExplainerCard,
  trustdraft: QuestionnaireCard,
};
