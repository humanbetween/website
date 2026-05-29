import { NextResponse } from "next/server";
import { listPrompts } from "@/lib/prompts/queries";
import { CATEGORIES, type Category, type SortKey } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catRaw = searchParams.get("cat");
  const category =
    catRaw && (CATEGORIES as readonly string[]).includes(catRaw)
      ? (catRaw as Category)
      : null;
  const freeOnly = searchParams.get("free") === "1";
  const sortRaw = searchParams.get("sort");
  const sort: SortKey = sortRaw === "popular" ? "popular" : "recent";
  const search = searchParams.get("q");
  const cursor = searchParams.get("cursor");

  try {
    const data = await listPrompts({ cursor, category, freeOnly, sort, search });
    return NextResponse.json(data);
  } catch (err) {
    console.error("listPrompts failed", err);
    return NextResponse.json({ items: [], nextCursor: null });
  }
}
