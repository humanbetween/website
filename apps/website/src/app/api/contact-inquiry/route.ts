import { NextResponse } from "next/server";
import { z } from "zod";
import { resend, fromEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const TO_EMAIL = "hello@humanbetween.com";

const bodySchema = z.object({
  companySize: z.enum(["1", "2-10", "11-50", "51-200", "200+"]),
  email: z.string().email().max(120),
  needs: z.string().max(500),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { companySize, email, needs } = parsed.data;

  try {
    await resend.emails.send({
      from: `Human Between <${fromEmail}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New pricing inquiry — ${companySize} · ${email}`,
      text: `New pricing inquiry from ${email}

Company size: ${companySize}
Email: ${email}

Needs:
${needs.trim() || "(not provided)"}
`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact-inquiry send failed", err);
    return NextResponse.json({ error: "Could not send" }, { status: 500 });
  }
}
