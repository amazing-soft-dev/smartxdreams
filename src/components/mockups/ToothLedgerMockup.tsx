import { cx } from "@/lib/cx";
import { MockupFrame } from "./MockupFrame";

/** Quote lines with the plan's estimated share. Generic treatments and round illustrative amounts. */
const lines = [
  { item: "Exam and cleaning", fee: 180, plan: 180, waiting: null },
  { item: "Filling, back tooth", fee: 240, plan: 192, waiting: null },
  { item: "Crown", fee: 1150, plan: 575, waiting: "Covered from 1 March (waiting period)" },
];

/** Yearly maximum benefit and what has already been used this year. */
const YEARLY_MAX = 1500;
const USED = 350;

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
              <span>
                {l.item}
                {l.waiting ? (
                  <span className="mt-1 block w-fit rounded-full bg-[#fff4dd] px-2 py-0.5 text-[0.6875rem] font-medium text-[#6b4500]">
                    {l.waiting}
                  </span>
                ) : null}
              </span>
              <span className="text-ink/70">
                you <span className="font-medium text-ink">{money(l.fee - l.plan)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 flex justify-between">
            Yearly limit after this work
            <span className="text-ink/70">
              {money(Math.max(0, YEARLY_MAX - USED - plan))} of {money(YEARLY_MAX)} left
            </span>
          </p>
          <span className="flex h-2 overflow-hidden rounded-full bg-ink/[0.08]">
            <span className="bg-ink/40" style={{ width: `${(USED / YEARLY_MAX) * 100}%` }} />
            <span className="bg-violet-500" style={{ width: `${(Math.min(plan, YEARLY_MAX - USED) / YEARLY_MAX) * 100}%` }} />
          </span>
          <p className="mt-1 text-[0.6875rem] text-ink/60">Grey: used earlier this year · Violet: this work</p>
        </div>
      </MockupFrame>
    </div>
  );
}
