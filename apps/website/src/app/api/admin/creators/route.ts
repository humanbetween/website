import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["active", "suspended"]).optional(),
  commissionRateBps: z.number().int().min(0).max(10000).optional(),
});

async function gate() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (!(await isAdmin(session.user.id))) return null;
  return session;
}

export async function PATCH(request: Request) {
  const session = await gate();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { userId, status, commissionRateBps } = parsed.data;
  if (status === undefined && commissionRateBps === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await db
      .update(schema.affiliateAccounts)
      .set({
        ...(status !== undefined ? { status } : {}),
        ...(commissionRateBps !== undefined ? { commissionRateBps } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.affiliateAccounts.userId, userId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update affiliate failed", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
