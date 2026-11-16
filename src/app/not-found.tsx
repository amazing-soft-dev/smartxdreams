import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { cx } from "@/lib/cx";

/** The three glass tiles, tilted alternately; the middle "0" glows coral. Decorative. */
const tiles = [
  { char: "4", tilt: "-rotate-6", glow: false },
  { char: "0", tilt: "rotate-3 -translate-y-3", glow: true },
  { char: "4", tilt: "rotate-6", glow: false },
];

export default function NotFound() {
  return (
    <Section surface="dark" labelledBy="not-found-title" className="min-h-[90svh] pt-36 md:pt-44">
      <Glow color="coral" size={720} opacity={0.35} className="top-24 left-1/2 -translate-x-1/2" />
      <div className="flex flex-col items-center text-center">
        <div aria-hidden="true" className="flex gap-3 md:gap-5">
          {tiles.map((tile, i) => (
            <span
              key={i}
              className={cx(
                "flex size-24 items-center justify-center rounded-[26px] text-[3.5rem] leading-none ring-1 backdrop-blur-[15px] md:size-36 md:rounded-[34px] md:text-[5.5rem]",
                tile.tilt,
                tile.glow
                  ? "bg-coral-500/90 text-ink shadow-[0_20px_80px_rgb(255_107_61/0.45)] ring-coral-300/60"
                  : "bg-white/10 text-white ring-white/15",
              )}
            >
              {tile.char}
            </span>
          ))}
        </div>

        <Tag tone="dark" className="mt-12">
          Error 404 · Page not found
        </Tag>
        <h1 id="not-found-title" className="mt-5 max-w-2xl text-h2">
          This page took a <span className="text-violet-300">wrong turn.</span>
        </h1>
        <p className="mt-4 max-w-md text-body-l text-white/65">
          The link may be old, or the page may have moved. Here are the places people usually look for.
        </p>
      </div>
    </Section>
  );
}
