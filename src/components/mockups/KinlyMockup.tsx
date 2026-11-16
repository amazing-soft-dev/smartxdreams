import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/**
 * Kinly product mockup: a letter explained in plain words, with a scam warning underneath. Large text, as in
 * the product. Illustrative content with no real person, company or account; aria-hidden.
 */
export function KinlyLetterMockup({ className }: { className?: string }) {
  return (
    <MockupFrame title="Kinly" caption="Letter from your insurer" className={className}>
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

/** The KinlyMockup used by the product page; extended with the document shelf and check-in below. */
export function KinlyMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      <KinlyLetterMockup />
    </div>
  );
}
