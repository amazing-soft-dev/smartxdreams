import type { CSSProperties } from "react";
import { SYMBOL } from "@/lib/brand-symbol";
import { CLOUD_CROSSING_RADIUS, CLOUD_CUT, CLOUD_STROKE_SCALE } from "./symbol-mask";

/** Room around the artwork for the puffed-out, blurred strands and their shadow, in symbol units. */
const PAD = 40;
const { x, y, width, height } = SYMBOL.box;
const VIEW_BOX = `${x - PAD} ${y - PAD} ${width + PAD * 2} ${height + PAD * 2}`;
/** The svg is taller than the artwork by the padding; the CSS scales its height by this. */
const FRAME_STYLE = {
  "--earth-symbol-frame": ((height + PAD * 2) / height).toFixed(4),
  aspectRatio: `${width + PAD * 2} / ${height + PAD * 2}`,
} as CSSProperties;
const MASK_BOX = { x: x - PAD, y: y - PAD, width: width + PAD * 2, height: height + PAD * 2 };
const STRAND = SYMBOL.stroke * CLOUD_STROKE_SCALE;

/**
 * The SmartxDreams symbol as cloud, for the CSS fallback: the same strands and crossings as the shader's mask,
 * widened, roughened by turbulence and blurred, with a soft shadow below. Static; the filter runs once.
 * There is one fallback per page, so the ids are fixed.
 */
export function CloudSymbol({ className }: { className?: string }) {
  const { overD, overS } = SYMBOL.crossings;
  const strands = (
    <>
      <path d={SYMBOL.d} fill="none" strokeWidth={STRAND} strokeLinecap="round" mask="url(#earth-cloud-cut-d)" />
      <path d={SYMBOL.s} fill="none" strokeWidth={STRAND} strokeLinecap="round" mask="url(#earth-cloud-cut-s)" />
    </>
  );
  return (
    <svg viewBox={VIEW_BOX} className={className} style={FRAME_STYLE} aria-hidden="true" focusable="false">
      <defs>
        <filter id="earth-cloud-puff" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="earth-cloud-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="earth-cloud-over-d">
          <circle cx={overD.cx} cy={overD.cy} r={CLOUD_CROSSING_RADIUS} />
        </clipPath>
        <clipPath id="earth-cloud-over-s">
          <circle cx={overS.cx} cy={overS.cy} r={CLOUD_CROSSING_RADIUS} />
        </clipPath>
        {/* The D is cut where the S passes over it, and the S where the D passes over it. */}
        <mask id="earth-cloud-cut-d" maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={SYMBOL.s} fill="none" stroke="#000" strokeWidth={CLOUD_CUT} clipPath="url(#earth-cloud-over-d)" />
        </mask>
        <mask id="earth-cloud-cut-s" maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={SYMBOL.d} fill="none" stroke="#000" strokeWidth={CLOUD_CUT} clipPath="url(#earth-cloud-over-s)" />
        </mask>
      </defs>
      <g stroke="rgb(6 18 58)" opacity="0.4" transform="translate(14 18)" filter="url(#earth-cloud-shadow)">
        {strands}
      </g>
      <g stroke="#fbf8f4" filter="url(#earth-cloud-puff)">
        {strands}
      </g>
    </svg>
  );
}
