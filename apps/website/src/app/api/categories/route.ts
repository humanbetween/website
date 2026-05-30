import { NextResponse } from "next/server";
import { getPromptCategories } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await getPromptCategories();
  return NextResponse.json({ categories });
}
