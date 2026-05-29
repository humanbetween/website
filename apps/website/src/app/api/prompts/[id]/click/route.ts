import { NextResponse } from "next/server";
import { z } from "zod";
import { incrementPopularity } from "@/lib/prompts/queries";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    await incrementPopularity(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("incrementPopularity failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
