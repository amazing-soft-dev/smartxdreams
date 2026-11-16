import { type Photo, photos } from "@/content/photos";

const sourceName = { unsplash: "Unsplash", pexels: "Pexels" } as const;

/** One credit line: photographer (linked to their profile), source (linked to the photo page) and license. */
function PhotoCredit({ photo }: { photo: Photo }) {
  const { credit } = photo;
  return (
    <li>
      Photo by{" "}
      <a href={credit.profileUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
        {credit.photographer}
      </a>{" "}
      on{" "}
      <a href={credit.photoUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
        {sourceName[credit.source]}
      </a>{" "}
      ({credit.license})
    </li>
  );
}

/** Credits for every registered photo: photographer and source, with links. Renders nothing without photos. */
export function PhotoCredits({ className }: { className?: string }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="photo-credits-title" className={className}>
      <h2 id="photo-credits-title" className="text-h6">
        Photo credits
      </h2>
      <ul className="mt-4 grid gap-2 text-label text-ink/65 sm:grid-cols-2">
        {photos.map((photo) => (
          <PhotoCredit key={photo.slot} photo={photo} />
        ))}
      </ul>
    </section>
  );
}
