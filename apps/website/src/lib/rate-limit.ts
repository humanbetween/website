import { NextResponse } from "next/server";

// In-memory fixed-window limiter. Per serverless instance (resets on cold
// start, not shared across instances) — enough to stop naive flooding/abuse of
// public endpoints. For hard guarantees, swap for a shared store (Upstash).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function purge(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  purge(now);
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate-limit a request by client IP. Returns a 429 response when the limit is
 * hit, or null when the request should proceed.
 */
export function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ok = allow(`${name}:${clientIp(request)}`, limit, windowMs);
  if (ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429 },
  );
}
