import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared counter across all serverless instances via Upstash Redis. Falls back
// to a no-op when the env vars are absent (local/preview), so nothing breaks.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// One Ratelimit per (name, limit, window), cached. ephemeralCache short-circuits
// repeat-offenders in-process to save Redis round-trips.
const limiters = new Map<string, Ratelimit>();
const ephemeralCache = new Map<string, number>();

function getLimiter(
  name: string,
  limit: number,
  windowMs: number,
): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${limit}:${windowMs}`;
  let rl = limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `rl:${name}`,
      ephemeralCache,
    });
    limiters.set(key, rl);
  }
  return rl;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate-limit a request by client IP. Returns a 429 response when the limit is
 * hit, or null when the request should proceed. No-ops when Upstash isn't
 * configured, and fails open if Redis is unreachable (availability over strict
 * limiting).
 */
export async function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const rl = getLimiter(name, limit, windowMs);
  if (!rl) return null;
  try {
    const { success } = await rl.limit(clientIp(request));
    if (success) return null;
  } catch (err) {
    console.error("rate limit check failed", err);
    return null;
  }
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429 },
  );
}
