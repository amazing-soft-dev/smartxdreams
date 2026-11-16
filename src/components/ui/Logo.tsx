import Image from "next/image";

type LogoProps = {
  /** "full" is the mark with the wordmark; "mark" is the symbol alone. */
  variant?: "full" | "mark";
  /** "dark" for light surfaces (ink artwork), "light" for dark surfaces (white artwork). */
  tone?: "dark" | "light";
  /** Rendered height in pixels. Width follows the artwork's aspect ratio. */
  height?: number;
  /** Accessible name. Pass decorative when visible text next to the logo already names the company. */
  label?: string;
  decorative?: boolean;
  className?: string;
  /** Load eagerly (above the fold). */
  priority?: boolean;
};

const MARK_RATIO = 380 / 328;
const FULL_RATIO = 2400 / 480;

/**
 * SmartxDreams logo. The mark is inline SVG (sharp at every size, no request); the full logo uses the
 * brand PNGs, with a white-artwork variant for dark surfaces (public/brand/logo-full-light.png).
 */
export function Logo({
  variant = "full",
  tone = "dark",
  height = 32,
  label = "SmartxDreams",
  decorative = false,
  className,
  priority = false,
}: LogoProps) {
  if (variant === "mark") {
    const square = tone === "light" ? "#FFFFFF" : "#0F1226";
    return (
      <svg
        viewBox="38 82 380 328"
        height={height}
        width={Math.round(height * MARK_RATIO)}
        className={className}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? true : undefined}
        focusable="false"
      >
        <rect x="38" y="82" width="253" height="254" rx="38" fill={square} />
        <circle cx="291" cy="283.5" r="126.5" fill="#6D4AFF" />
        <path d="M291 157A126.5 126.5 0 0 0 175.9 336H253A38 38 0 0 0 291 298Z" fill="#FF6B3D" />
      </svg>
    );
  }

  return (
    <Image
      src={tone === "light" ? "/brand/logo-full-light.png" : "/brand/logo-full.png"}
      alt={decorative ? "" : label}
      height={height}
      width={Math.round(height * FULL_RATIO)}
      className={className}
      priority={priority}
    />
  );
}
