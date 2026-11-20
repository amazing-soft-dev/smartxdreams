import { DigitRoller } from "@/components/ui/DigitRoller";
import { visibleStats } from "@/content/stats";

/**
 * A row of real numbers, rolled in digit by digit. Renders nothing until src/content/stats.ts has at least
 * one stat with a real value, so the page never shows a made-up or placeholder figure.
 */
export function HonestStats() {
  const stats = visibleStats();
  if (stats.length === 0) return null;
  return (
    <dl className="mt-14 grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-card bg-canvas p-7">
          <dt className="text-label text-ink/70">{stat.label}</dt>
          <dd className="mt-3 text-h2">
            <DigitRoller value={`${(stat.value ?? 0).toLocaleString("en-US")}${stat.suffix ?? ""}`} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
