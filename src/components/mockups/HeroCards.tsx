import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/** A small pill used inside the mockups. */
function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "violet" | "coral" | "ok" | "warn" }) {
  const tones = {
    neutral: "bg-ink/[0.06] text-ink/70",
    violet: "bg-violet-50 text-violet-700",
    coral: "bg-coral-50 text-coral-700",
    ok: "bg-[#e6f7ee] text-[#137a45]",
    warn: "bg-[#fff4dd] text-[#8a5a00]",
  } as const;
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium", tones[tone])}>{children}</span>;
}

/** A thin progress bar. */
function Bar({ value, tone = "violet" }: { value: number; tone?: "violet" | "coral" }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
      <span className={cx("block h-full rounded-full", tone === "violet" ? "bg-violet-500" : "bg-coral-500")} style={{ width: `${value}%` }} />
    </span>
  );
}

/** JobAtlas: one feed of jobs from several sources, with duplicates merged. Source names are plain text. */
export function JobFeedCard({ className }: { className?: string }) {
  const jobs = [
    { role: "Product Designer", company: "Northwind", sources: ["LinkedIn", "Indeed"], merged: true },
    { role: "Frontend Engineer", company: "Acme Labs", sources: ["Company site"], merged: false },
    { role: "Data Analyst", company: "Bluebird", sources: ["Dice", "Jobright"], merged: true },
  ];
  return (
    <MockupFrame title="JobAtlas" caption="12,408 jobs" className={className}>
      {jobs.map((job) => (
        <div key={job.role} className="rounded-xl bg-canvas px-3 py-2">
          <p className="font-medium">{job.role}</p>
          <p className="text-ink/55">{job.company}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {job.sources.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
            {job.merged ? <Chip tone="violet">Duplicate merged</Chip> : null}
          </div>
        </div>
      ))}
    </MockupFrame>
  );
}

/** ApplyPilot: fields filled from the profile, then a review step before submit. */
export function AutofillCard({ className }: { className?: string }) {
  const fields = [
    { label: "Full name", value: "Jordan Lee" },
    { label: "Current title", value: "Senior Analyst" },
    { label: "Years of experience", value: "6" },
  ];
  return (
    <MockupFrame title="ApplyPilot" caption="Filling 3 of 9" className={className}>
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-ink/55">{f.label}</p>
          <p className="mt-0.5 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1.5">
            {f.value}
            <span className="text-violet-600">✓</span>
          </p>
        </div>
      ))}
      <p className="mt-1 rounded-lg bg-ink px-3 py-2 text-center font-medium text-white">Review before you submit</p>
    </MockupFrame>
  );
}

/** SiteLog: the day's report drafted from photos and a voice note. */
export function SiteReportCard({ className }: { className?: string }) {
  return (
    <MockupFrame title="SiteLog" caption="Tue · Daily report" className={className}>
      <div className="flex gap-2">
        <Chip>12°C · light rain</Chip>
        <Chip>Crew 6</Chip>
      </div>
      {[
        { area: "Framing, level 2", value: 70 },
        { area: "Electrical rough-in", value: 35 },
      ].map((row) => (
        <div key={row.area}>
          <p className="mb-1 flex justify-between">
            {row.area} <span className="text-ink/55">{row.value}%</span>
          </p>
          <Bar value={row.value} />
        </div>
      ))}
      <Chip tone="warn">Delay: window delivery moved to Thu</Chip>
    </MockupFrame>
  );
}

/** ToothLedger: what you pay, what insurance pays, and what is left this year. */
export function CostBarCard({ className }: { className?: string }) {
  return (
    <MockupFrame title="ToothLedger" caption="Estimate" className={className}>
      <p className="text-ink/55">You pay (estimate)</p>
      <p className="text-[1.375rem] leading-none font-medium">$412</p>
      <span className="flex h-2.5 overflow-hidden rounded-full">
        <span className="bg-violet-500" style={{ width: "64%" }} />
        <span className="bg-coral-500" style={{ width: "36%" }} />
      </span>
      <p className="flex justify-between text-ink/55">
        <span>Plan pays $738</span>
        <span>You $412</span>
      </p>
      <div>
        <p className="mb-1 flex justify-between">
          Yearly limit left <span className="text-ink/55">$262 of $1,000</span>
        </p>
        <Bar value={26} tone="coral" />
      </div>
      <Chip tone="ok">Splitting across two years saves about $180</Chip>
    </MockupFrame>
  );
}

/** Kinly: a letter explained in plain words, with a scam warning. */
export function BillExplainerCard({ className }: { className?: string }) {
  return (
    <MockupFrame title="Kinly" caption="Letter from your insurer" className={className}>
      <p className="rounded-xl bg-canvas px-3 py-2 text-[0.8125rem] leading-snug">
        Your monthly premium goes up by <strong className="font-medium">$12</strong> from 1 March. You do not need to do
        anything.
      </p>
      <div className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2">
        <p className="font-medium text-coral-800">Possible scam</p>
        <p className="text-coral-800/80">A text asking for your card number to “keep coverage” is not from your insurer.</p>
      </div>
    </MockupFrame>
  );
}

/** TrustDraft: drafted answers with their source, and a flag where nothing backs an answer up. */
export function QuestionnaireCard({ className }: { className?: string }) {
  const rows = [
    { q: "Is data encrypted at rest?", source: "Security policy §4.2", ok: true },
    { q: "Do you run annual pen tests?", source: "Testing plan §2", ok: true },
    { q: "Is there a 24/7 SOC?", source: "No source found", ok: false },
  ];
  return (
    <MockupFrame title="TrustDraft" caption="Vendor review · 41 of 120" className={className}>
      {rows.map((r) => (
        <div key={r.q} className="rounded-xl bg-canvas px-3 py-2">
          <p className="font-medium">{r.q}</p>
          <div className="mt-1.5">{r.ok ? <Chip tone="violet">{r.source}</Chip> : <Chip tone="warn">{r.source}: needs a person</Chip>}</div>
        </div>
      ))}
    </MockupFrame>
  );
}
