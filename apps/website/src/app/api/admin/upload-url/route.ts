import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { makePresignedUpload } from "@/lib/r2";
import { uploadUrlSchema } from "@/lib/prompts/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = uploadUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await makePresignedUpload(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("makePresignedUpload failed", err);
    return NextResponse.json({ error: "Upload setup failed" }, { status: 500 });
  }
}
