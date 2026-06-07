import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await rateLimit(request, "favorite", 60, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const { id: promptId } = await params;
  if (!isUuid(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const existing = (
      await db
        .select({ userId: schema.favorites.userId })
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.userId, userId),
            eq(schema.favorites.promptId, promptId),
          ),
        )
        .limit(1)
    )[0];

    let favorited: boolean;
    if (existing) {
      await db
        .delete(schema.favorites)
        .where(
          and(
            eq(schema.favorites.userId, userId),
            eq(schema.favorites.promptId, promptId),
          ),
        );
      await db
        .update(schema.prompts)
        .set({
          favoriteCount: sql`greatest(${schema.prompts.favoriteCount} - 1, 0)`,
        })
        .where(eq(schema.prompts.id, promptId));
      favorited = false;
    } else {
      await db
        .insert(schema.favorites)
        .values({ userId, promptId })
        .onConflictDoNothing();
      await db
        .update(schema.prompts)
        .set({ favoriteCount: sql`${schema.prompts.favoriteCount} + 1` })
        .where(eq(schema.prompts.id, promptId));
      favorited = true;
    }

    const updated = (
      await db
        .select({ count: schema.prompts.favoriteCount })
        .from(schema.prompts)
        .where(eq(schema.prompts.id, promptId))
        .limit(1)
    )[0];

    return NextResponse.json({ favorited, count: updated?.count ?? 0 });
  } catch (err) {
    console.error("favorite toggle failed", err);
    return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
