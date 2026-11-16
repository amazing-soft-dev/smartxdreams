import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

type Row = { q: string; answer: string | null; source: string | null; status: "approved" | "review" | "unsupported" };

const rows: Row[] = [
  {
    q: "Is customer data encrypted at rest?",
    answer: "Yes. Production databases and backups use AES-256 encryption at rest.",
    source: "Security policy §4.2",
    status: "approved",
  },
  {
    q: "How often do you run penetration tests?",
    answer: "Once a year by an external firm, and after major changes.",
    source: "Testing plan §2.1",
    status: "review",
  },
];

/**
 * TrustDraft product mockup: questionnaire rows with drafted answers and the policy passage each came from.
 * Illustrative questions and document names; aria-hidden.
 */
export function TrustDraftMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      <MockupFrame title="TrustDraft" caption="Vendor security review · 41 of 120">
        {rows.map((r) => (
          <div key={r.q} className="rounded-xl bg-canvas px-3 py-2.5">
            <p className="font-medium">{r.q}</p>
            <p className="mt-1 text-ink/75">{r.answer}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[0.6875rem] font-medium text-violet-700">
              Source: {r.source}
            </p>
          </div>
        ))}
      </MockupFrame>
    </div>
  );
}
