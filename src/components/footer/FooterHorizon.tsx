/**
 * Where the far ridge's crest runs, as a share of the drawing's height from its top: the far path averages
 * about y = 40 in the 200-high viewBox. The aurora reads this from `data-footer-ridge` to rest its horizon
 * line on the hills.
 */
export const RIDGE_CREST = 0.2;

/**
 * The ground the viewer stands on: two dark rolling ridges, a far one with a faint violet crest catching
 * the aurora's light and a near one in the darkest ink, so the bottom bar sits on the land and the aurora
 * rises behind the hills. Place it inside the bottom bar (a positioned box): it spans the full width of the
 * footer, rises a little above the bar so its crest stands in for a divider, and runs down to the footer's
 * bottom edge. On narrow screens it keeps at least 1100 px of width, cropped at the sides, so the hills
 * stay gentle instead of squeezing into steep waves. Decorative: hidden from assistive technology.
 */
export function FooterHorizon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-footer-ridge={RIDGE_CREST}
      className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-[calc(100%+6.5rem)] w-[max(100vw,1100px)] -translate-x-1/2"
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="footer-ridge-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141733" />
          <stop offset="0.5" stopColor="#0d0f24" />
        </linearGradient>
        <linearGradient id="footer-ridge-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0c1d" />
          <stop offset="1" stopColor="#080a18" />
        </linearGradient>
      </defs>
      {/* Far ridge: higher on the screen and a shade lighter than the near one, darker than the glowing sky. */}
      <path
        d="M0 62C120 40 220 30 330 44S520 24 640 20 840 48 960 42 1160 10 1280 22 1410 44 1440 40V200H0Z"
        fill="url(#footer-ridge-far)"
      />
      <path
        d="M0 62C120 40 220 30 330 44S520 24 640 20 840 48 960 42 1160 10 1280 22 1410 44 1440 40"
        fill="none"
        stroke="#aa97ff"
        strokeOpacity="0.18"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {/* Near ridge: lower and darker, the ground under the bottom bar. */}
      <path d="M0 98C140 80 260 88 380 76S600 96 740 92 980 70 1100 74 1320 94 1440 84V200H0Z" fill="url(#footer-ridge-near)" />
    </svg>
  );
}
