import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

// Cross-instance rate limiting on the sensitive auth paths (BetterAuth's own
// limiter is per-instance). The magic-link request sends an email per call, so
// it gets the tightest limit to prevent email bombing / Resend abuse.
export async function POST(request: Request) {
  const path = new URL(request.url).pathname;
  if (path.includes("/magic-link")) {
    const limited = await rateLimit(request, "auth-magic", 5, 60_000);
    if (limited) return limited;
  } else if (path.includes("/sign-in") || path.includes("/sign-up")) {
    const limited = await rateLimit(request, "auth", 20, 60_000);
    if (limited) return limited;
  }
  return handler.POST(request);
}
