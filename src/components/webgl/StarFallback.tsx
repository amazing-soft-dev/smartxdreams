import { cx } from "@/lib/cx";

/**
 * Static star field in pure CSS: three layers of tiny radial-gradient dots at different densities, plus a
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
            "radial-gradient(1px 1px at 20px 30px, rgb(255 255 255 / 0.9), transparent 60%)",
            "radial-gradient(1px 1px at 120px 80px, rgb(255 255 255 / 0.7), transparent 60%)",
            "radial-gradient(1.5px 1.5px at 60px 140px, rgb(170 151 255 / 0.9), transparent 60%)",
          ].join(", "),
          backgroundSize: "180px 180px",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 40px 60px, rgb(255 255 255 / 0.8), transparent 60%)",
            "radial-gradient(1.5px 1.5px at 210px 170px, rgb(255 161 124 / 0.8), transparent 60%)",
          ].join(", "),
          backgroundSize: "260px 260px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 30% 35%, rgb(109 74 255 / 0.22), transparent 70%), radial-gradient(40% 35% at 75% 60%, rgb(255 107 61 / 0.12), transparent 70%)",
        }}
      />
    </div>
  );
}
