import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resolveAffiliate } from "@/lib/affiliate";
import { creatorSubmitSchema } from "@/lib/prompts/schema";
import { createSubmission } from "@/lib/submissions";
import {
  sendSubmissionReceivedEmail,
  sendAdminNewSubmissionEmail,
} from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "creator-submit", 20, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const affiliate = await resolveAffiliate(session.user.id);
  if (!affiliate) {
    return NextResponse.json({ error: "Not a creator" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = creatorSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = await createSubmission(session.user.id, parsed.data);
  if (!id) {
    return NextResponse.json({ error: "Could not submit" }, { status: 500 });
  }

  if (session.user.email) {
    await sendSubmissionReceivedEmail({
      to: session.user.email,
      title: parsed.data.title,
    }).catch((err) => console.error("submission received email failed", err));
  }
  await sendAdminNewSubmissionEmail({
    creatorEmail: session.user.email ?? "unknown",
    title: parsed.data.title,
  }).catch((err) => console.error("admin new submission email failed", err));

  return NextResponse.json({ id });
}
