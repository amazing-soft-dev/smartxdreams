import type { ComponentType } from "react";
import {
  BillExplainerCard,
  CostBarCard,
  QuestionnaireCard,
} from "@/components/mockups/HeroCards";
import { ApplyPilotMockup } from "@/components/mockups/ApplyPilotMockup";
import { JobAtlasMockup } from "@/components/mockups/JobAtlasMockup";
import { SiteLogMockup } from "@/components/mockups/SiteLogMockup";

/** The mockup shown in each product's hero. Product page issues can swap in larger, dedicated mockups. */
export const productMockups: Record<string, ComponentType<{ className?: string }>> = {
  jobatlas: JobAtlasMockup,
  applypilot: ApplyPilotMockup,
  sitelog: SiteLogMockup,
  toothledger: CostBarCard,
  kinly: BillExplainerCard,
  trustdraft: QuestionnaireCard,
};
