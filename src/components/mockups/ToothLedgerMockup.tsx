import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/** Quote lines with the plan's estimated share. Generic treatments and round illustrative amounts. */
const lines = [
  { item: "Exam and cleaning", fee: 180, plan: 180 },
  { item: "Filling, back tooth", fee: 240, plan: 192 },
  { item: "Crown", fee: 1150, plan: 575 },
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * ToothLedger product mockup: the quote broken down into what the plan is likely to pay and what you are
 * likely to pay. Illustrative amounts, no real person or provider data; aria-hidden.
 */
export function ToothLedgerMockup({ className }: { className?: string }) {
  const total = lines.reduce((s, l) => s + l.fee, 0);
  const plan = lines.reduce((s, l) => s + l.plan, 0);
  const you = total - plan;
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      <MockupFrame title="ToothLedger" caption="Estimate from your documents">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-ink/60">You would pay (estimate)</p>
            <p className="text-[1.75rem] leading-none font-medium">{money(you)}</p>
          </div>
          <p className="text-right text-ink/60">
            Quote {money(total)}
            <br />
            Plan pays {money(plan)}
          </p>
        </div>
        <ul className="flex flex-col gap-1.5">
          {lines.map((l) => (
            <li key={l.item} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2">
              <span>{l.item}</span>
              <span className="text-ink/70">
                you <span className="font-medium text-ink">{money(l.fee - l.plan)}</span>
              </span>
            </li>
          ))}
        </ul>
      </MockupFrame>
    </div>
  );
}
