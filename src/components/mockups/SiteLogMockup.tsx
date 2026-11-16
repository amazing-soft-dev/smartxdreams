import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/** What the foreman captured: four photo tiles and a voice note with its waveform. */
function CaptureCard({ className }: { className?: string }) {
  const bars = [6, 12, 8, 16, 10, 14, 7, 18, 11, 9, 15, 6, 12, 8, 13];
  return (
    <MockupFrame title="Today's capture" caption="Tue 14 Oct" tone="dark" className={className}>
      <div className="grid grid-cols-4 gap-1.5">
        {["bg-[#5b5f73]", "bg-[#7a6f5d]", "bg-[#4d5a52]", "bg-[#6a5f75]"].map((tone, i) => (
          <span key={i} className={cx("aspect-square rounded-lg", tone)} />
        ))}
      </div>
      <p className="text-white/60">12 photos · Level 2, east stair, site entrance</p>
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-coral-500 text-[0.625rem] text-ink">▶</span>
        <span className="flex h-5 flex-1 items-center gap-[3px]">
          {bars.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-white/70" style={{ height: h }} />
          ))}
        </span>
        <span className="text-white/60">1:48</span>
      </div>
    </MockupFrame>
  );
}

/** A labelled block of the generated report. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2.5">
      <p className="font-mono text-[0.625rem] font-semibold tracking-[0.06em] text-ink/60 uppercase">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * SiteLog product mockup: the day's photos and voice note (left) turned into a draft report (right) with
 * weather, crew, progress and delays, waiting for the foreman's review. Illustrative data; aria-hidden.
 */
export function SiteLogMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      <CaptureCard className="sm:mr-24" />
      <MockupFrame title="SiteLog" caption="Draft report" className="mt-3 sm:absolute sm:-right-3 sm:top-24 sm:mt-0 sm:w-72">
        <Block title="Weather">12°C, light rain until 11:00. Pour delayed 1 h.</Block>
        <Block title="Crew">
          6 on site: 3 framers, 2 electricians, 1 labourer
        </Block>
        <Block title="Progress">
          <p className="flex justify-between">
            Framing, level 2 <span className="text-ink/55">70%</span>
          </p>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
            <span className="block h-full w-[70%] rounded-full bg-violet-500" />
          </span>
        </Block>
        <Block title="Delays">
          <span className="text-coral-800">Window delivery moved to Thursday (supplier).</span>
        </Block>
        <p className="rounded-xl bg-ink px-3 py-2 text-center font-medium text-white">Review and edit before sharing</p>
      </MockupFrame>
    </div>
  );
}
