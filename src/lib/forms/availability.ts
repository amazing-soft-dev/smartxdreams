/**
 * Whether forms can send. The static export (NEXT_OUTPUT=export) has no server and no /api routes, so
 * next.config.ts sets NEXT_PUBLIC_STATIC_EXPORT there and forms show a clear message instead of failing.
 * Inlined at build time.
 */
export const formsCanSend = process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true";
