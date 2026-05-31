import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactInquiryEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await sendContactInquiryEmail({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      message: parsed.data.message.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact inquiry failed", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
