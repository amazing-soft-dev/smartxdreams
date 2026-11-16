import { roadmap } from "@/content/roadmap";
import { cx } from "@/lib/cx";

/** A horizontal strip of roadmap steps. "Now" items are coral; everything else is labelled "Planned". */
export function RoadmapStrip() {
  return (
    <div className="mt-16">
      <h3 className="text-h6">Roadmap</h3>
      <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {roadmap.map((item) => (
          <li key={item.title} className="relative rounded-[22px] border border-ink/10 p-6">
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-micro tracking-[0.04em] uppercase",
                item.status === "now" ? "bg-coral-500 text-ink" : "bg-ink/[0.06] text-ink/75",
              )}
            >
              {item.status === "now" ? "Now" : "Planned"}
            </span>
            <p className="mt-4 text-body-l font-medium">{item.title}</p>
            <p className="mt-2 text-label text-ink/70">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
