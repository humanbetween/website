import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { resolveActiveAffiliate } from "@/lib/affiliate";
import { makePresignedUpload } from "@/lib/r2";
import { uploadUrlSchema } from "@/lib/prompts/schema";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Presigned R2 upload, for admins and active creators (avatars + submissions).
export async function POST(request: Request) {
  const limited = await rateLimit(request, "upload-url", 30, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed =
    (await isAdmin(session.user.id)) ||
    !!(await resolveActiveAffiliate(session.user.id));
  if (!allowed) {
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
