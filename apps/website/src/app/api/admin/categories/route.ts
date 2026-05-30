import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { addPromptCategory } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  label: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const categories = await addPromptCategory(parsed.data.label);
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("addPromptCategory failed", err);
    return NextResponse.json({ error: "Add failed" }, { status: 500 });
  }
}
