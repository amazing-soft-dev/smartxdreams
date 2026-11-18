import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/**
 * SeniorAIPlans product mockup: a letter explained in plain words, with a scam warning underneath. Large text, as in
 * the product. Illustrative content with no real person, company or account; aria-hidden.
 */
export function SeniorAIPlansLetterMockup({ className }: { className?: string }) {
  return (
    <MockupFrame title="SeniorAIPlans" caption="Letter from your insurer" className={className}>
      <p className="text-[0.75rem] text-ink/70">What this letter says</p>
      <p className="rounded-xl bg-canvas px-3.5 py-3 text-[1rem] leading-snug text-ink">
        Your monthly payment goes up by <strong className="font-semibold">$12</strong> from 1 March. You do not need to
        do anything.
      </p>
      <div className="rounded-xl border-2 border-coral-600 bg-coral-50 px-3.5 py-3 text-ink">
        <p className="text-[0.9375rem] font-semibold text-coral-900">This text message looks like a scam</p>
        <p className="mt-1 text-[0.875rem] leading-snug">
          It asks for your card number to “keep your cover”. Your insurer does not ask for that by text. Call them on the
          number on your card.
        </p>
      </div>
    </MockupFrame>
  );
}

/** The document shelf: folders with what is inside and the next date that matters. */
function ShelfMockup({ className }: { className?: string }) {
  const folders = [
    { name: "Health insurance", note: "Renews 1 June" },
    { name: "Bank letters", note: "3 this month" },
    { name: "Home and utilities", note: "Water bill due Friday" },
  ];
  return (
    <MockupFrame title="Your papers" tone="dark" className={className}>
      {folders.map((f) => (
        <p key={f.name} className="flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2 text-[0.875rem]">
          {f.name}
          <span className="text-[0.8125rem] text-white/75">{f.note}</span>
        </p>
      ))}
      <div className="rounded-xl bg-violet-500 px-3 py-2.5 text-[0.875rem] text-white">
        <p className="font-semibold">Weekly check-in</p>
        <p className="mt-0.5">How are things this week? Your water bill is due on Friday.</p>
      </div>
    </MockupFrame>
  );
}

/** The SeniorAIPlans product page mockup: the explained letter, with the document shelf and weekly check-in. */
export function SeniorAIPlansMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      <SeniorAIPlansLetterMockup className="sm:mr-20" />
      <ShelfMockup className="mt-3 sm:absolute sm:-right-3 sm:-bottom-20 sm:mt-0 sm:w-72" />
    </div>
  );
}
