import { photos } from "@/content/photos";

const sourceName = { unsplash: "Unsplash", pexels: "Pexels" } as const;

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
          <li key={photo.slot}>
            Photo by{" "}
            <a href={photo.credit.profileUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
              {photo.credit.photographer}
            </a>{" "}
            on{" "}
            <a href={photo.credit.photoUrl} rel="noopener noreferrer" target="_blank" className="text-ink underline underline-offset-4">
              {sourceName[photo.credit.source]}
            </a>{" "}
            ({photo.credit.license})
          </li>
        ))}
      </ul>
    </section>
  );
}
