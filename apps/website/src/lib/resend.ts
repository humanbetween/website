import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY ?? "re_placeholder";
export const resend = new Resend(apiKey);

export const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await resend.emails.send({
    from: `Human Between <${fromEmail}>`,
    to,
    subject: "Your sign-in link",
    text: `Click to sign in to Human Between:\n\n${url}\n\nThis link expires in 5 minutes.`,
    html: magicLinkHtml(url),
  });
}

function magicLinkHtml(url: string) {
  return `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#1c1916;color:#fafaf9;padding:40px 0;margin:0">
  <table align="center" style="max-width:480px;margin:0 auto;background:#2a2724;border-radius:12px;padding:32px">
    <tr><td>
      <h1 style="font-size:18px;font-weight:500;margin:0 0 16px">Sign in to Human Between</h1>
      <p style="color:#a8a29e;margin:0 0 24px">Click the button below to continue. The link expires in 5 minutes.</p>
      <a href="${url}" style="display:inline-block;background:#fafaf9;color:#1c1916;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:500;font-size:14px">Sign in</a>
      <p style="color:#78716c;margin:24px 0 0;font-size:12px">If you didn't request this, you can ignore this email.</p>
    </td></tr>
  </table>
</body></html>`;
}
