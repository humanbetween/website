import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { resolveAffiliate } from "@/lib/affiliate";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  avatarUrl: z
    .string()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), {
      message: "Avatar must be a URL",
    })
    .nullable(),
});

export async function PATCH(request: Request) {
  const limited = await rateLimit(request, "creator-profile", 20, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const affiliate = await resolveAffiliate(session.user.id);
  if (!affiliate) {
    return NextResponse.json({ error: "Not a creator" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db
    .update(schema.affiliateAccounts)
    .set({
      avatarUrl: parsed.data.avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.affiliateAccounts.userId, session.user.id));

  return NextResponse.json({ ok: true });
}
