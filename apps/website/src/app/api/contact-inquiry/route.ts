import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactInquiryEmail } from "@/lib/resend";
import { postContactInquiryToSlack } from "@/lib/slack";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "contact", 5, 10 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const payload = {
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim(),
    message: parsed.data.message.trim(),
  };

  const [emailRes, slackRes] = await Promise.allSettled([
    sendContactInquiryEmail(payload),
    postContactInquiryToSlack(payload),
  ]);

  if (emailRes.status === "rejected") {
    console.error("contact inquiry email failed", emailRes.reason);
  }
  if (slackRes.status === "rejected") {
    console.error("contact inquiry slack failed", slackRes.reason);
  }

  if (emailRes.status === "rejected" && slackRes.status === "rejected") {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
