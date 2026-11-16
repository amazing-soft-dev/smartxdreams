import Image from "next/image";
import { useId } from "react";

type LogoProps = {
  /** "full" is the mark with the wordmark; "mark" is the symbol alone. */
  variant?: "full" | "mark";
  /**
   * "dark" is artwork for light surfaces (navy and violet, smartxdreams-symbol-light-bg);
   * "light" is artwork for dark surfaces (lavender, smartxdreams-symbol-dark-bg).
   */
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

type Tone = NonNullable<LogoProps["tone"]>;

/**
 * The symbol from public/brand/smartxdreams-symbol-*-bg.svg: an S (top) and a D (bottom) drawn as two
 * 18-unit strokes that pass over and under each other. The viewBox is cropped from the master's padded
 * 390-unit square to the strokes themselves, so `height` is the height of the artwork.
 */
const SYMBOL = {
  viewBox: "216 116 168 273",
  ratio: 168 / 273,
  s: "M384 125H300A75 75 0 1 0 375 200",
  d: "M225 380V305A75 75 0 1 1 300 380Z",
  stroke: 18,
  /** Where the S crosses over the D (right) and the D over the S (left); the strokes underneath are cut there. */
  crossings: { overD: { cx: 353.56, cy: 252.5 }, overS: { cx: 246.44, cy: 252.5 } },
  crossingRadius: 36,
  /** Width of the cut: the stroke plus a 7-unit gap on each side. */
  cut: 32,
} as const;

/** Stroke colours of the two master files. */
const SYMBOL_COLORS: Record<Tone, { s: string; d: string }> = {
  dark: { s: "#2B2170", d: "#6E56F0" },
  light: { s: "#A99BFF", d: "#E6E1FF" },
};

const MASK_BOX = { x: 105, y: 57.5, width: 390, height: 390 } as const;

type SymbolMarkProps = {
  tone: Tone;
  height: number;
  label: string;
  decorative: boolean;
  className?: string;
};

function SymbolMark({ tone, height, label, decorative, className }: SymbolMarkProps) {
  // The logo appears several times on a page (header, menu, footer, transition): every instance needs
  // its own mask and clip-path ids, or they would all point at the first one in the document.
  const id = useId().replace(/[^\w-]/g, "");
  const ids = { maskD: `${id}-md`, maskS: `${id}-ms`, clipR: `${id}-cr`, clipL: `${id}-cl` };
  const colors = SYMBOL_COLORS[tone];
  const { overD, overS } = SYMBOL.crossings;
  return (
    <svg
      viewBox={SYMBOL.viewBox}
      height={height}
      width={Math.round(height * SYMBOL.ratio)}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <defs>
        <clipPath id={ids.clipR}>
          <circle cx={overD.cx} cy={overD.cy} r={SYMBOL.crossingRadius} />
        </clipPath>
        <clipPath id={ids.clipL}>
          <circle cx={overS.cx} cy={overS.cy} r={SYMBOL.crossingRadius} />
        </clipPath>
        {/* The D is cut where the S passes over it, and the S where the D passes over it. */}
        <mask id={ids.maskD} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={SYMBOL.s} fill="none" stroke="#000" strokeWidth={SYMBOL.cut} clipPath={`url(#${ids.clipR})`} />
        </mask>
        <mask id={ids.maskS} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={SYMBOL.d} fill="none" stroke="#000" strokeWidth={SYMBOL.cut} clipPath={`url(#${ids.clipL})`} />
        </mask>
      </defs>
      <path d={SYMBOL.d} fill="none" stroke={colors.d} strokeWidth={SYMBOL.stroke} mask={`url(#${ids.maskD})`} />
      <path d={SYMBOL.s} fill="none" stroke={colors.s} strokeWidth={SYMBOL.stroke} mask={`url(#${ids.maskS})`} />
    </svg>
  );
}

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
    return <SymbolMark tone={tone} height={height} label={label} decorative={decorative} className={className} />;
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
