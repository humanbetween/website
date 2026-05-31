import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { ids } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: schema.prompts.id })
        .from(schema.prompts)
        .where(inArray(schema.prompts.id, ids));
      const known = new Set(existing.map((r) => r.id));
      const filtered = ids.filter((id) => known.has(id));

      await Promise.all(
        filtered.map((id, index) =>
          tx
            .update(schema.prompts)
            .set({ displayOrder: index, updatedAt: new Date() })
            .where(eq(schema.prompts.id, id)),
        ),
      );
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reorder failed", err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
