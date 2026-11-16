import { cx } from "@/lib/cx";

const fields = [
  { label: "Full name", value: "Jordan Lee", from: "Profile" },
  { label: "Email", value: "jordan@example.com", from: "Profile" },
  { label: "Current title", value: "Senior Analyst", from: "Resume · Experience" },
  { label: "Years of experience", value: "6", from: "Resume · Experience" },
  { label: "Why this role?", value: "", from: "Needs you" },
];

/**
 * ApplyPilot product mockup: a browser window on an employer's application form. Fields filled from the
 * profile are highlighted with where each answer came from, one question is left for the person, and the
 * extension panel ends with "Review before you submit". Illustrative data; aria-hidden.
 */
export function ApplyPilotMockup({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("overflow-hidden rounded-[22px] bg-white text-left text-ink shadow-[0_24px_60px_rgb(0_0_0/0.35)] ring-1 ring-ink/5", className)}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-ink/5 bg-canvas px-4 py-2.5">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-ink/15" />
          <span className="size-2 rounded-full bg-ink/15" />
          <span className="size-2 rounded-full bg-ink/15" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[0.6875rem] text-ink/65">careers.example.com/apply</span>
        <span className="rounded-md bg-violet-500 px-2 py-1 text-[0.6875rem] font-medium text-white">ApplyPilot</span>
      </div>
      <div className="flex flex-col gap-2.5 p-4 text-[0.75rem]">
        <p className="text-[0.8125rem] font-medium">Apply: Senior Analyst</p>
        {fields.map((f) => (
          <div key={f.label}>
            <p className="flex justify-between text-ink/65">
              {f.label}
              <span className={f.value ? "text-violet-700" : "text-coral-700"}>{f.from}</span>
            </p>
            <p
              className={cx(
                "mt-0.5 min-h-8 rounded-lg border px-2.5 py-1.5",
                f.value ? "border-violet-200 bg-violet-50/60" : "border-dashed border-coral-300 bg-coral-50/50 text-coral-800",
              )}
            >
              {f.value || "Left for you to answer"}
            </p>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl bg-ink px-3 py-2.5 text-white">
          <span>4 of 5 filled. Review before you submit.</span>
          <span className="rounded-md bg-white px-2 py-1 text-[0.6875rem] font-medium text-ink">Review</span>
        </div>
      </div>
    </div>
  );
}
