import { cx } from "@/lib/cx";

/**
 * Static star field in pure CSS: tiles of tiny hard-edged radial-gradient dots at two densities, plus a
 * faint violet and coral haze. Shown for reduced motion, data saver, low-power devices, missing WebGL, and
 * while the three.js scene loads. Decorative.
 */
export function StarFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 20px 30px, rgb(255 255 255 / 0.9) 0 1px, transparent 1.5px)",
            "radial-gradient(circle at 120px 80px, rgb(255 255 255 / 0.7) 0 0.8px, transparent 1.3px)",
            "radial-gradient(circle at 60px 140px, rgb(170 151 255 / 0.9) 0 1.2px, transparent 1.8px)",
          ].join(", "),
          backgroundSize: "180px 180px",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 40px 60px, rgb(255 255 255 / 0.8) 0 0.9px, transparent 1.4px)",
            "radial-gradient(circle at 210px 170px, rgb(255 161 124 / 0.8) 0 1.2px, transparent 1.8px)",
          ].join(", "),
          backgroundSize: "260px 260px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 35%, rgb(109 74 255 / 0.22), rgb(109 74 255 / 0) 60%), radial-gradient(ellipse at 75% 60%, rgb(255 107 61 / 0.12), rgb(255 107 61 / 0) 60%)",
        }}
      />
    </div>
  );
}
