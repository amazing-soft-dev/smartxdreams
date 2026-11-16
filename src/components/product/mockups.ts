import type { ComponentType } from "react";
import {
  AutofillCard,
  BillExplainerCard,
  CostBarCard,
  QuestionnaireCard,
  SiteReportCard,
} from "@/components/mockups/HeroCards";
import { JobAtlasMockup } from "@/components/mockups/JobAtlasMockup";

/** The mockup shown in each product's hero. Product page issues can swap in larger, dedicated mockups. */
export const productMockups: Record<string, ComponentType<{ className?: string }>> = {
  jobatlas: JobAtlasMockup,
  applypilot: AutofillCard,
  sitelog: SiteReportCard,
  toothledger: CostBarCard,
  kinly: BillExplainerCard,
  trustdraft: QuestionnaireCard,
};
