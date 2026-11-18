import brandMarks from "@/lib/brand-marks.json";
import { cx } from "@/lib/cx";

type LogoProps = {
  /** "full" is the mark with the wordmark; "mark" is the ribbon alone. */
  variant?: "full" | "mark";
  /**
   * "dark" is artwork for light surfaces (the charcoal ribbon, ink wordmark);
   * "light" is artwork for dark surfaces (the white ribbon, white wordmark).
   */
  tone?: "dark" | "light";
  /** Rendered height of the mark in pixels. Width follows the artwork's aspect ratio. */
  height?: number;
  /** Accessible name. Pass decorative when visible text next to the logo already names the company. */
  label?: string;
  decorative?: boolean;
  className?: string;
};

type Tone = NonNullable<LogoProps["tone"]>;

/** The built mark files (scripts/build-brand.mjs) behind each tone: named by the surface they sit on. */
const MARK_FILE: Record<Tone, keyof typeof brandMarks.marks> = {
  dark: "smartxdreams-mark-on-light",
  light: "smartxdreams-mark-on-dark",
};

/** Path of a tone's mark at one of the built widths. */
export function markSrc(tone: Tone, width: number): string {
  return `/brand/logo/${MARK_FILE[tone]}-${width}.webp`;
}

/** The mark's trimmed size in master pixels, which fixes its aspect ratio. */
export function markSize(tone: Tone): { width: number; height: number } {
  return brandMarks.marks[MARK_FILE[tone]];
}

/** Width in px of a tone's mark drawn `height` px tall. */
export function markWidth(tone: Tone, height: number): number {
  const { width, height: h } = markSize(tone);
  return Math.round((height * width) / h);
}

/** Every built width as a srcset, so the browser picks the sharpest file for the screen's pixel density. */
export function markSrcSet(tone: Tone): string {
  return brandMarks.widths.map((w) => `${markSrc(tone, w)} ${w}w`).join(", ");
}

/** The fallback src: the smallest built width at least twice the drawn width (sharp on 2x screens). */
function fallbackWidth(width: number): number {
  const widths = brandMarks.widths;
  return widths.find((w) => w >= width * 2) ?? widths[widths.length - 1]!;
}

type MarkProps = {
  tone: Tone;
  height: number;
  label: string;
  decorative: boolean;
  className?: string;
};

function Mark({ tone, height, label, decorative, className }: MarkProps) {
  const width = markWidth(tone, height);
  return (
    // A plain <img>: the files are already built at fixed widths, so next/image would only add a loader the
    // static export cannot run.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={markSrc(tone, fallbackWidth(width))}
      srcSet={markSrcSet(tone)}
      style={{ height }}
      alt={decorative ? "" : label}
      aria-hidden={decorative ? true : undefined}
      decoding="async"
      draggable={false}
      className={cx("block shrink-0 select-none", className)}
    />
  );
}

/** Wordmark colours: the text takes the old S stroke's role, the "x" the D stroke's accent. */
const WORDMARK_COLORS: Record<Tone, { text: string; accent: string }> = {
  dark: { text: "#2B2170", accent: "#6E56F0" },
  light: { text: "#E6E1FF", accent: "#A99BFF" },
};

/** Wordmark size and spacing as fractions of the logo height. */
const WORDMARK = { fontSize: 0.6, gap: 0.3 } as const;

/**
 * SmartxDreams logo.
 * - "mark": the SD ribbon alone, from the files scripts/build-brand.mjs builds out of assets/brand/.
 * - "full": the ribbon next to the wordmark "SmartxDreams", set as live text in Inter Tight (the site font)
 *   with the "x" in the accent colour. The text is hidden from assistive technology; the whole logo is one
 *   image named by `label`.
 */
export function Logo({
  variant = "full",
  tone = "dark",
  height = 32,
  label = "SmartxDreams",
  decorative = false,
  className,
}: LogoProps) {
  if (variant === "mark") {
    return <Mark tone={tone} height={height} label={label} decorative={decorative} className={className} />;
  }

  const colors = WORDMARK_COLORS[tone];
  return (
    <span
      className={cx("inline-flex shrink-0 items-center", className)}
      style={{ height, gap: Math.round(height * WORDMARK.gap) }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <Mark tone={tone} height={height} label={label} decorative />
      <span
        aria-hidden="true"
        className="font-sans leading-none font-semibold tracking-[-0.03em] whitespace-nowrap"
        style={{ fontSize: Math.round(height * WORDMARK.fontSize), color: colors.text }}
      >
        Smart<span style={{ color: colors.accent }}>x</span>Dreams
      </span>
    </span>
  );
}
