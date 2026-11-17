/**
 * Security headers for every response of the server build (next.config.ts). The static export cannot set
 * headers; its host must add them (docs/launch.md).
 *
 * Content-Security-Policy notes:
 * - script-src needs 'unsafe-inline' because Next.js inlines its bootstrap scripts in statically
 *   generated pages; a nonce would force every page to render per request. JSON-LD blocks are data, not
 *   scripts, so CSP does not apply to them. 'unsafe-eval' is added in development only (React's dev tools).
 * - Vercel Web Analytics and Speed Insights load and report from this origin (/_vercel/*), so 'self' covers
 *   them. Vercel preview deployments also load the Vercel toolbar from vercel.live.
 * - img-src allows data: and blob: for blur placeholders; fonts are self-hosted by next/font.
 * - The WebGL scenes need nothing extra; worker-src allows blob: in case a library spins up a worker.
 */
export function securityHeaders({ dev, preview }: { dev: boolean; preview: boolean }): { key: string; value: string }[] {
  const toolbar = preview ? " https://vercel.live" : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${toolbar}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${toolbar}`,
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}${toolbar}`,
    `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
  ];
}
