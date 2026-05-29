import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db, schema } from "@/lib/db";
import { promptPatchSchema } from "@/lib/prompts/schema";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

async function gate() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (!(await isAdmin(session.user.id))) return null;
  return session;
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await gate();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idOk = idSchema.safeParse(id);
  if (!idOk.success) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = promptPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    await db
      .update(schema.prompts)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(eq(schema.prompts.id, idOk.data), isNull(schema.prompts.deletedAt)),
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update prompt failed", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await gate();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idOk = idSchema.safeParse(id);
  if (!idOk.success) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  try {
    await db
      .update(schema.prompts)
      .set({ deletedAt: new Date() })
      .where(eq(schema.prompts.id, idOk.data));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("soft delete failed", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
