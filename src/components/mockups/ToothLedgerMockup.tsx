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
const USED = 900;

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * ToothLedger product mockup: the quote broken down into what the plan is likely to pay and what you are
 * likely to pay. Illustrative amounts, no real person or provider data; aria-hidden.
 */
export function ToothLedgerMockup({ className }: { className?: string }) {
  const total = lines.reduce((s, l) => s + l.fee, 0);
  // The plan share is capped by what is left of this year's maximum.
  const planShare = lines.reduce((s, l) => s + l.plan, 0);
  const plan = Math.min(planShare, YEARLY_MAX - USED);
  const you = total - plan;
  // Split: everything except the crown now, the crown next calendar year with a fresh maximum.
  const crown = lines[lines.length - 1] ?? { fee: 0, plan: 0 };
  const nowPart = lines.slice(0, -1);
  const youNow = nowPart.reduce((s, l) => s + l.fee - l.plan, 0);
  const youNextYear = crown.fee - crown.plan;
  const youSplit = youNow + youNextYear;
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
                plan share <span className="font-medium text-ink">{money(l.plan)}</span>
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
      <MockupFrame title="Two-year option" caption="Compare" tone="dark" className="mt-3 sm:absolute sm:-right-4 sm:-bottom-16 sm:mt-0 sm:w-64">
        <p className="flex justify-between">
          All this year <span className="font-medium">{money(you)}</span>
        </p>
        <p className="flex justify-between">
          Crown next year <span className="font-medium">{money(youSplit)}</span>
        </p>
        <p className="rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-white/80">
          Possible difference: about {money(you - youSplit)}. Not a guarantee. Ask your dentist whether the crown can wait.
        </p>
      </MockupFrame>
    </div>
  );
}
