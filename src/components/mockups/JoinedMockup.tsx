import { MockupFrame } from "./MockupFrame";

const listings = [
  { role: "Product Designer", company: "Northwind", place: "Remote · EU", sources: ["LinkedIn", "Indeed"], posted: "2 days ago" },
  { role: "Frontend Engineer", company: "Acme Labs", place: "Berlin", sources: ["Company site"], posted: "Today" },
  { role: "Data Analyst", company: "Bluebird", place: "Lisbon", sources: ["Dice", "Jobright", "LinkedIn"], posted: "5 days ago" },
  { role: "UX Researcher", company: "Harbor & Co", place: "Remote", sources: ["Indeed"], posted: "1 week ago" },
];

/**
 * Joined product mockup: a search bar, filters, and one list of jobs from several sources. Source names
 * are plain text chips (no third-party logos), and merged duplicates show how many places a job was posted.
 * Illustrative data. Decorative (the frame is aria-hidden).
 */
export function JoinedFeedMockup({ className }: { className?: string }) {
  return (
    <MockupFrame title="JobAtlas" caption="Product design · Europe" className={className}>
      <div className="flex items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-ink/60">
        <span aria-hidden="true">⌕</span> product designer, remote, €60k+
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Remote", "Full time", "Posted this week", "Duplicates merged"].map((f) => (
          <span key={f} className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.6875rem] font-medium text-violet-700">
            {f}
          </span>
        ))}
      </div>
      {listings.map((job) => (
        <div key={job.role} className="rounded-xl bg-canvas px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">{job.role}</p>
            <p className="shrink-0 text-[0.6875rem] text-ink/65">{job.posted}</p>
          </div>
          <p className="text-ink/65">
            {job.company} · {job.place}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {job.sources.map((s) => (
              <span key={s} className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.6875rem] text-ink/70">
                {s}
              </span>
            ))}
            {job.sources.length > 1 ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.6875rem] font-medium text-violet-700">
                Posted in {job.sources.length} places
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </MockupFrame>
  );
}

/** The company-details drawer that opens beside a job: size, funding, reviews and other open roles. */
export function CompanyDrawerMockup({ className }: { className?: string }) {
  const facts = [
    { label: "Size", value: "120 people" },
    { label: "Funding", value: "Series B" },
    { label: "Public reviews", value: "4.1 / 5 (86)" },
  ];
  return (
    <MockupFrame title="Northwind" caption="Company" tone="dark" className={className}>
      <div className="grid grid-cols-3 gap-2">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl bg-white/[0.06] px-2.5 py-2">
            <p className="text-[0.6875rem] text-white/55">{f.label}</p>
            <p className="mt-0.5 font-medium">{f.value}</p>
          </div>
        ))}
      </div>
      <p className="text-white/55">Also hiring</p>
      {["Design Systems Lead", "Content Designer"].map((role) => (
        <p key={role} className="rounded-xl bg-white/[0.06] px-3 py-2">
          {role}
        </p>
      ))}
    </MockupFrame>
  );
}

/** The Joined hero mockup: the feed, with the company drawer overlapping its lower corner on wider screens. */
export function JoinedMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative ${className ?? ""}`}>
      <JoinedFeedMockup className="sm:mr-16" />
      <CompanyDrawerMockup className="mt-3 sm:absolute sm:-right-2 sm:-bottom-10 sm:mt-0 sm:w-64" />
    </div>
  );
}
