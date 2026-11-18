import type { ComponentType } from "react";
import { AcornMockup } from "@/components/mockups/AcornMockup";
import { JoinedMockup } from "@/components/mockups/JoinedMockup";
import { SeniorAIPlansMockup } from "@/components/mockups/SeniorAIPlansMockup";
import { SiteLogMockup } from "@/components/mockups/SiteLogMockup";
import { ToothLedgerMockup } from "@/components/mockups/ToothLedgerMockup";
import { TrustDraftMockup } from "@/components/mockups/TrustDraftMockup";

/** The mockup shown in each product's hero. Product page issues can swap in larger, dedicated mockups. */
export const productMockups: Record<string, ComponentType<{ className?: string }>> = {
  joined: JoinedMockup,
  acorn: AcornMockup,
  sitelog: SiteLogMockup,
  toothledger: ToothLedgerMockup,
  senioraiplans: SeniorAIPlansMockup,
  trustdraft: TrustDraftMockup,
};
