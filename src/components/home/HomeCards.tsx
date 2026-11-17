import { Container } from "@/components/ui/Container";
import { HeroWave } from "./HeroWave";

/**
 * The six product mockups, in a dark band directly under the hero. They used to sit inside the hero; there
 * they would cover the planet and the SmartxDreams symbol in its clouds. The band overlaps the hero's bottom
 * edge with rounded top corners, like the page surface on the reference, so the planet runs under it instead
 * of stopping at a hard line. The cards themselves are decorative (see HeroWave).
 */
export function HomeCards() {
  return (
    <div
      data-surface="dark"
      data-nav-theme="dark"
      className="relative z-10 -mt-4 rounded-t-[28px] bg-ink pt-6 pb-14 text-white md:rounded-t-[36px] md:pt-8 md:pb-20"
    >
      <Container>
        <HeroWave />
      </Container>
    </div>
  );
}
