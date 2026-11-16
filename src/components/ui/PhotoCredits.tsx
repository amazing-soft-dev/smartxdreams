import { Photo as RegistryPhoto } from "@/components/ui/Photo";
import { type Photo, photos } from "@/content/photos";

const sourceName = { unsplash: "Unsplash", pexels: "Pexels" } as const;

/**
 * One credit: a thumbnail of the photo, then photographer (linked to their profile), source (linked to the
 * photo page) and license. The thumbnail is hidden from screen readers: the photo's alt text is read where
 * the photo is used, and here the credit text is what matters.
 */
function PhotoCredit({ photo }: { photo: Photo }) {
  const { credit } = photo;
  return (
    <li className="flex items-center gap-3">
      <div aria-hidden="true" data-credit-thumb className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
        <RegistryPhoto slot={photo.slot} fill sizes="64px" />
      </div>
      <p>
        Photo by{" "}
        <a href={credit.profileUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
          {credit.photographer}
        </a>{" "}
        on{" "}
        <a href={credit.photoUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
          {sourceName[credit.source]}
        </a>{" "}
        ({credit.license})
      </p>
    </li>
  );
}

/** Credits for every registered photo, each with a thumbnail and linked credit. Renders nothing without photos. */
export function PhotoCredits({ className }: { className?: string }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="photo-credits-title" className={className}>
      <h2 id="photo-credits-title" className="text-h6">
        Photo credits
      </h2>
      <ul className="mt-6 grid gap-x-6 gap-y-3 text-label text-ink/65 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <PhotoCredit key={photo.slot} photo={photo} />
        ))}
      </ul>
    </section>
  );
}
