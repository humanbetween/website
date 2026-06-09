import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  approveSubmission,
  rejectSubmission,
  getUserEmail,
} from "@/lib/submissions";
import { slugify } from "@/lib/prompts/slug";
import { appUrl } from "@/lib/stripe";
import {
  sendSubmissionApprovedEmail,
  sendSubmissionRejectedEmail,
} from "@/lib/resend";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), notes: z.string().min(1).max(2000) }),
]);

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "approve") {
      const result = await approveSubmission(id);
      if (!result) {
        return NextResponse.json({ error: "Not pending" }, { status: 404 });
      }
      const email = result.createdByUserId
        ? await getUserEmail(result.createdByUserId)
        : null;
      if (email) {
        await sendSubmissionApprovedEmail({
          to: email,
          title: result.title,
          url: appUrl(`/?prompt=${slugify(result.title)}`),
        }).catch((err) => console.error("approved email failed", err));
      }
      return NextResponse.json({ ok: true });
    }

    const result = await rejectSubmission(id, parsed.data.notes);
    if (!result) {
      return NextResponse.json({ error: "Not pending" }, { status: 404 });
    }
    const email = result.createdByUserId
      ? await getUserEmail(result.createdByUserId)
      : null;
    if (email) {
      await sendSubmissionRejectedEmail({
        to: email,
        title: result.title,
        notes: parsed.data.notes,
      }).catch((err) => console.error("rejected email failed", err));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("review submission failed", err);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
