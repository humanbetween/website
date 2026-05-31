import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db, schema } from "@/lib/db";
import { promptFormSchema } from "@/lib/prompts/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = promptFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const minRow = (
      await db
        .select({ min: sql<number>`coalesce(min(${schema.prompts.displayOrder}), 0)` })
        .from(schema.prompts)
        .where(isNull(schema.prompts.deletedAt))
    )[0];
    const displayOrder = (minRow?.min ?? 0) - 1;

    const [row] = await db
      .insert(schema.prompts)
      .values({
        title: parsed.data.title,
        description: parsed.data.description,
        promptText: parsed.data.promptText,
        priceCents: parsed.data.priceCents,
        isFree: parsed.data.isFree,
        videoUrl: parsed.data.videoUrl,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        referenceImageUrl: parsed.data.referenceImageUrl ?? null,
        assets: parsed.data.assets,
        categories: parsed.data.categories,
        tags: parsed.data.tags,
        tools: parsed.data.tools,
        displayOrder,
      })
      .returning({ id: schema.prompts.id });
    return NextResponse.json({ id: row?.id });
  } catch (err) {
    console.error("insert prompt failed", err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
