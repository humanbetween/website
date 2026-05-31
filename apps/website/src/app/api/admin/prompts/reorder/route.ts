import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
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
    const cases = sql.join(
      ids.map((id, index) => sql`when ${id}::uuid then ${index}`),
      sql.raw(" "),
    );
    const idList = sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql.raw(", "),
    );
    await db.execute(sql`
      update ${schema.prompts}
      set display_order = case id ${cases} end,
          updated_at = now()
      where id in (${idList})
    `);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reorder failed", err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
