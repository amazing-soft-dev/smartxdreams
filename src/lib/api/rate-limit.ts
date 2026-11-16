/**
 * Per-IP rate limiting for the form endpoints: a sliding window kept in memory.
 *
 * Memory is per server instance, so on Vercel each function instance counts separately and a cold start
 * resets the count. That is enough to stop one client hammering a form; it is not a global quota. If abuse
 * ever needs a shared limit, swap the Map for a store such as Upstash Redis behind the same function.
 */

type Window = { hits: number[] };

const windows = new Map<string, Window>();
let lastSweep = 0;

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Drops windows with no recent hits so the map cannot grow without bound. */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.hits.every((t) => now - t >= windowMs)) windows.delete(key);
  }
}

/**
 * Records a hit for `key` and says whether it is within `limit` hits per `windowMs`.
 * Rejected hits are not recorded, so a client that waits is let back in on time.
 */
export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }, now = Date.now()): RateLimitResult {
  sweep(now, windowMs);
  const window = windows.get(key) ?? { hits: [] };
  window.hits = window.hits.filter((t) => now - t < windowMs);
  if (window.hits.length >= limit) {
    const oldest = window.hits[0] ?? now;
    windows.set(key, window);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  window.hits.push(now);
  windows.set(key, window);
  return { allowed: true };
}

/**
 * The client's IP address from the proxy headers Vercel sets (the first x-forwarded-for entry), or
 * "unknown". Used only as a rate-limit key in memory: never logged or stored.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test helper: forget every window. */
export function resetRateLimits() {
  windows.clear();
  lastSweep = 0;
}
