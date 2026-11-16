import Image from "next/image";

export default function HomePage() {
  return (
    <main>
      {/* Decorative: the wordmark in the image is repeated by the h1 below. */}
      <Image
        src="/04 Overlap-selection (6).png"
        alt=""
        width={600}
        height={120}
        priority
      />
      <h1>SmartxDreams</h1>
      <p>The new SmartxDreams website is under construction.</p>
    </main>
  );
}
