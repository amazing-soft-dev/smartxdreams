import type { ComponentType } from "react";
import {
  QuestionnaireCard,
} from "@/components/mockups/HeroCards";
import { ApplyPilotMockup } from "@/components/mockups/ApplyPilotMockup";
import { JobAtlasMockup } from "@/components/mockups/JobAtlasMockup";
import { KinlyMockup } from "@/components/mockups/KinlyMockup";
import { SiteLogMockup } from "@/components/mockups/SiteLogMockup";
import { ToothLedgerMockup } from "@/components/mockups/ToothLedgerMockup";

/** The mockup shown in each product's hero. Product page issues can swap in larger, dedicated mockups. */
export const productMockups: Record<string, ComponentType<{ className?: string }>> = {
  jobatlas: JobAtlasMockup,
  applypilot: ApplyPilotMockup,
  sitelog: SiteLogMockup,
  toothledger: ToothLedgerMockup,
  kinly: KinlyMockup,
  trustdraft: QuestionnaireCard,
};
