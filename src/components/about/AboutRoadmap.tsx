import { RoadmapStrip } from "@/components/home/RoadmapStrip";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** "Roadmap": the shared roadmap strip without its own heading. */
export function AboutRoadmap() {
  return (
    <Section labelledBy="roadmap-title" surface="canvas">
      <SectionHeader
        id="roadmap-title"
        tag="Roadmap"
        title="Where we are *headed*."
        description="Only the first step is true today. The rest are plans, so they carry no dates."
      />
      <RoadmapStrip showHeading={false} className="mt-14" />
    </Section>
  );
}
