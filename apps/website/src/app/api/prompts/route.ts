import { NextResponse } from "next/server";
import { getCurrentAccess } from "@/lib/access";
import { listPrompts } from "@/lib/prompts/queries";
import type { SortKey } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

const CAT_RE = /^[A-Z0-9_]{1,40}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catRaw = searchParams.get("cat");
  const category = catRaw && CAT_RE.test(catRaw) ? catRaw : null;
  const freeOnly = searchParams.get("free") === "1";
  const favoritesOnly = searchParams.get("fav") === "1";
  const sortRaw = searchParams.get("sort");
  const sort: SortKey = sortRaw === "popular" ? "popular" : "recent";
  const search = searchParams.get("q");
  const cursor = searchParams.get("cursor");

  try {
    const { userId, hasUnlimited } = await getCurrentAccess();
    const data = await listPrompts({
      cursor,
      category,
      freeOnly,
      sort,
      search,
      hasUnlimited,
      favoritesOfUserId: favoritesOnly ? userId : null,
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("listPrompts failed", err);
    return NextResponse.json({ items: [], nextCursor: null });
  }
}
