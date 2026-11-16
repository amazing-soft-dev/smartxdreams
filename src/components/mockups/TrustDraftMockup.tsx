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
  {
    q: "Do you operate a 24/7 security operations centre?",
    answer: null,
    source: null,
    status: "unsupported",
  },
];

const statusLabel = { approved: "Approved by M. Chen", review: "Waiting for review", unsupported: "Can't back this up" } as const;

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
            {r.answer ? (
              <p className="mt-1 text-ink/75">{r.answer}</p>
            ) : (
              <p className="mt-1 text-ink/75">No passage in your documents supports an answer. Left for a person.</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.source ? (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.6875rem] font-medium text-violet-700">Source: {r.source}</span>
              ) : null}
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                  r.status === "approved" && "bg-[#e6f7ee] text-[#0f5a33]",
                  r.status === "review" && "bg-ink/[0.07] text-ink/75",
                  r.status === "unsupported" && "bg-[#fff4dd] text-[#6b4500]",
                )}
              >
                {statusLabel[r.status]}
              </span>
            </div>
          </div>
        ))}
      </MockupFrame>
      <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-[0.75rem] text-white/80 ring-1 ring-white/15">
        Export is locked until every answer is approved by a person.
      </p>
    </div>
  );
}
