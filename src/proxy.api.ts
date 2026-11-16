import { type NextRequest, NextResponse } from "next/server";

/**
 * Lowercase URLs: /About, /Products/Kinly and /BLOG all redirect (308, permanent) to the lowercase path,
 * keeping the query string. Every route on the site is lowercase, so this gives mixed-case links one
 * canonical address instead of a 404.
 *
 * Named proxy.api.ts so that only the server build (pageExtensions includes "api.ts") runs it; the static
 * export has no proxy.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();
  if (pathname === lower) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = lower;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Pages only: skip Next.js internals, Vercel's analytics endpoints, the API and any file with an extension.
  matcher: ["/((?!_next/|_vercel/|api/|.*\\.[A-Za-z0-9]+$).*)"],
};
