import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(120).optional(),
  source: z.enum(["signup", "checkout", "footer", "unknown"]).default("unknown"),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "newsletter", 5, 10 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await subscribeToNewsletter({
      email: parsed.data.email,
      name: parsed.data.name,
      source: parsed.data.source,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("newsletter subscribe failed", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
