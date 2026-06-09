import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveAffiliate } from "@/lib/affiliate";
import { creatorPatchSchema } from "@/lib/prompts/schema";
import { deleteOwnSubmission, updateOwnSubmission } from "@/lib/submissions";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

async function gate() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const affiliate = await resolveAffiliate(session.user.id);
  if (!affiliate) return null;
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
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = creatorPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ok = await updateOwnSubmission(session.user.id, id, parsed.data);
  if (!ok) {
    return NextResponse.json(
      { error: "Not found or not editable" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
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
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const ok = await deleteOwnSubmission(session.user.id, id);
  if (!ok) {
    return NextResponse.json(
      { error: "Not found or not deletable" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
