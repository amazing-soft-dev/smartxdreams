import { PhotoCredits } from "@/components/ui/PhotoCredits";
import { Container } from "@/components/ui/Container";

/** Every photo on the site is credited here, at the foot of the About page, as the Unsplash and Pexels licenses ask. */
export function AboutCredits() {
  return (
    <div className="bg-white pt-4 pb-20 md:pb-28">
      <Container>
        <PhotoCredits className="border-t border-ink/10 pt-10" />
      </Container>
    </div>
  );
}
