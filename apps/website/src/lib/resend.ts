import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY ?? "re_placeholder";
export const resend = new Resend(apiKey);

export const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
export const supportEmail =
  process.env.SUPPORT_EMAIL ?? "hello@humanprompts.ai";

// Brand/marketing emails always link to the canonical public domain,
// like the magic-link footer — never localhost or a preview URL.
const SITE = "https://humanprompts.ai";

export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to,
    subject: "Your sign-in link to Human Prompts",
    text:
      `One click to your prompts.\n\n` +
      `Tap to sign in to Human Prompts:\n${url}\n\n` +
      `This link is good for 5 minutes. If you didn't request it, just ignore this email — no account will be created.\n\n` +
      `— Human Prompts · humanprompts.ai`,
    html: magicLinkHtml(url),
  });
}

export async function sendWelcomeLeadEmail({ to }: { to: string }) {
  const { error } = await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to,
    subject: "Welcome to Human Prompts — you just made a great call",
    text:
      `Welcome in — you just made a great call. \u{1F389}\n\n` +
      `Joining Human Prompts is a decision you won't regret. We craft the best prompt for every kind of visual you could dream up — so you skip the guesswork and go straight to results that look incredible.\n\n` +
      `And this is just the start: free prompts are dropping soon, exclusively for the community. Keep an eye on your inbox.\n\n` +
      `Can't wait to see what you make.\n\n` +
      `Explore the library: ${SITE}\n\n` +
      `— Human Prompts · humanprompts.ai`,
    html: brandEmailShell({
      eyebrow: "Welcome",
      heading: "You just made a great call. \u{1F389}",
      bodyHtml:
        "Joining Human Prompts is a decision you won't regret. We craft <strong style=\"color:#fafaf9\">the best prompt for every kind of visual</strong> you could dream up — so you skip the guesswork and go straight to results that look incredible.<br><br>And this is just the start: <strong style=\"color:#fafaf9\">free prompts are dropping soon</strong>, exclusively for the community. Keep an eye on your inbox — we can't wait to see what you make.",
      ctaLabel: "Explore the library →",
      ctaUrl: SITE,
    }),
  });
  if (error) throw new Error(`welcome lead email: ${error.message}`);
}

export async function sendWelcomeCustomerEmail({
  to,
  tier,
}: {
  to: string;
  tier: "monthly" | "yearly";
}) {
  const plan = tier === "yearly" ? "yearly" : "monthly";
  const { error } = await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to,
    subject: "You're in — welcome to Human Prompts",
    text:
      `You're in.\n\n` +
      `Your ${plan} membership is active and the full library is unlocked. ` +
      `Open any prompt, copy it in one click, and paste it into your tool of choice.\n\n` +
      `Browse your prompts: ${SITE}\n` +
      `Manage your subscription: ${SITE}/account\n\n` +
      `— Human Prompts · humanprompts.ai`,
    html: brandEmailShell({
      eyebrow: "Membership active",
      heading: "You're in \u{1F389}",
      bodyHtml: `Your <strong style="color:#fafaf9">${plan}</strong> membership is active and the full library is unlocked. Open any prompt, copy it in one click, and paste it into your tool of choice.`,
      ctaLabel: "Browse your prompts →",
      ctaUrl: SITE,
      secondaryHtml: `Need to update your plan? <a href="${SITE}/account" style="color:#78716c;text-decoration:underline">Manage your subscription</a>.`,
    }),
  });
  if (error) throw new Error(`welcome customer email: ${error.message}`);
}

export async function sendCreatorWelcomeEmail({
  to,
  code,
  link,
}: {
  to: string;
  code: string;
  link: string;
}) {
  const { error } = await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to,
    subject: "You're a Human Prompts creator — here's your link",
    text:
      `Welcome to the creator program.\n\n` +
      `Your referral code is ${code}. Share your link and earn 10% on every sale ` +
      `you bring in:\n${link}\n\n` +
      `Track your referrals and earnings: ${SITE}/creator\n\n` +
      `— Human Prompts · humanprompts.ai`,
    html: brandEmailShell({
      eyebrow: "Creator program",
      heading: "You're in — start earning \u{1F680}",
      bodyHtml: `Your referral code is <strong style="color:#fafaf9">${code}</strong>. Share your link and earn <strong style="color:#fafaf9">10% on every sale</strong> you bring in. Commissions land in your creator dashboard.`,
      ctaLabel: "Copy your link →",
      ctaUrl: link,
      secondaryHtml: `Track referrals and earnings on your <a href="${SITE}/creator" style="color:#78716c;text-decoration:underline">creator dashboard</a>.`,
    }),
  });
  if (error) throw new Error(`creator welcome email: ${error.message}`);
}

export async function sendNewSubscriberEmail({
  email,
  name,
  source,
}: {
  email: string;
  name?: string;
  source: string;
}) {
  await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to: supportEmail,
    subject: `🎉 New newsletter subscriber: ${email}`,
    text:
      `New subscriber\n\n` +
      `Email: ${email}\n` +
      (name ? `Name: ${name}\n` : "") +
      `Source: ${source}\n` +
      `Time: ${new Date().toISOString()}\n`,
    html: newSubscriberHtml({ email, name, source }),
  });
}

function newSubscriberHtml({
  email,
  name,
  source,
}: {
  email: string;
  name?: string;
  source: string;
}) {
  const safeName = (name ?? "").replace(/[<>&]/g, "");
  return `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#1c1916;color:#fafaf9;padding:40px 0;margin:0">
  <table align="center" style="max-width:520px;margin:0 auto;background:#2a2724;border-radius:12px;padding:32px">
    <tr><td>
      <p style="color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px">New subscriber</p>
      <p style="margin:0 0 4px;font-size:18px;font-weight:600">🎉 Someone joined the list</p>
      <p style="margin:8px 0 0;color:#a8a29e">
        <a href="mailto:${email}" style="color:#fafaf9;text-decoration:none">${email}</a>
        ${safeName ? ` · <span style="color:#a8a29e">${safeName}</span>` : ""}
      </p>
      <p style="margin:16px 0 0;font-size:11px;color:#78716c">Source: ${source}</p>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendContactInquiryEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  await resend.emails.send({
    from: `Human Prompts <${fromEmail}>`,
    to: supportEmail,
    replyTo: email,
    subject: `[Contact] ${name} <${email}>`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: contactInquiryHtml({ name, email, message }),
  });
}

function contactInquiryHtml({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#1c1916;color:#fafaf9;padding:40px 0;margin:0">
  <table align="center" style="max-width:520px;margin:0 auto;background:#2a2724;border-radius:12px;padding:32px">
    <tr><td>
      <p style="color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px">New inquiry</p>
      <p style="margin:0 0 4px"><strong>${name}</strong></p>
      <p style="margin:0 0 24px"><a href="mailto:${email}" style="color:#a8a29e">${email}</a></p>
      <div style="background:#1c1916;border-radius:8px;padding:16px;color:#e7e5e4;font-size:14px;line-height:1.6">${safeMessage}</div>
      <p style="color:#78716c;margin:24px 0 0;font-size:11px">Reply directly to this email to respond.</p>
    </td></tr>
  </table>
</body></html>`;
}

function brandEmailShell({
  eyebrow,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  secondaryHtml,
}: {
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryHtml?: string;
}) {
  const logoUrl = "https://humanprompts.ai/icon.png";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fafaf9">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0a09;padding:48px 16px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px">
          <tr>
            <td align="center" style="padding-bottom:28px">
              <img src="${logoUrl}" alt="Human Prompts" width="56" height="56" style="display:block;border-radius:14px;background:#000" />
            </td>
          </tr>
          <tr>
            <td style="background:#1c1916;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:40px 32px">
              <p style="margin:0 0 12px;color:#78716c;font-size:11px;letter-spacing:0.12em;text-transform:uppercase">${eyebrow}</p>
              <h1 style="font-size:22px;line-height:1.3;font-weight:600;margin:0 0 12px;color:#fafaf9">${heading}</h1>
              <p style="color:#a8a29e;margin:0 0 28px;font-size:14px;line-height:1.65">${bodyHtml}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:9999px;background:linear-gradient(135deg,#38bdf8 0%,#22d3ee 50%,#34d399 100%)">
                    <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;border-radius:9999px;text-decoration:none;color:#0c0a09;font-weight:600;font-size:14px">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              ${
                secondaryHtml
                  ? `<p style="color:#78716c;margin:28px 0 0;font-size:12px;line-height:1.6">${secondaryHtml}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;color:#57534e;font-size:11px;line-height:1.6">
              Human Prompts · <a href="https://humanprompts.ai" style="color:#78716c;text-decoration:none">humanprompts.ai</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function magicLinkHtml(url: string) {
  const logoUrl = "https://humanprompts.ai/icon.png";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sign in to Human Prompts</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fafaf9">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0a09;padding:48px 16px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px">
          <tr>
            <td align="center" style="padding-bottom:28px">
              <img src="${logoUrl}" alt="Human Prompts" width="56" height="56" style="display:block;border-radius:14px;background:#000" />
            </td>
          </tr>
          <tr>
            <td style="background:#1c1916;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:40px 32px">
              <p style="margin:0 0 12px;color:#78716c;font-size:11px;letter-spacing:0.12em;text-transform:uppercase">Magic link</p>
              <h1 style="font-size:22px;line-height:1.3;font-weight:600;margin:0 0 12px;color:#fafaf9">One click to your prompts.</h1>
              <p style="color:#a8a29e;margin:0 0 28px;font-size:14px;line-height:1.65">
                Tap the button below to sign in to Human Prompts. The link is good for 5 minutes — after that just request a new one.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:9999px;background:linear-gradient(135deg,#38bdf8 0%,#22d3ee 50%,#34d399 100%)">
                    <a href="${url}" style="display:inline-block;padding:13px 28px;border-radius:9999px;text-decoration:none;color:#0c0a09;font-weight:600;font-size:14px">Sign in →</a>
                  </td>
                </tr>
              </table>
              <p style="color:#78716c;margin:32px 0 0;font-size:12px;line-height:1.6">
                If you didn't request this, you can safely ignore this email — no account will be created.
              </p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0 20px" />
              <p style="color:#57534e;margin:0;font-size:11px;line-height:1.6">
                Button not working? Paste this link into your browser:<br>
                <a href="${url}" style="color:#78716c;word-break:break-all;text-decoration:underline">${url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;color:#57534e;font-size:11px;line-height:1.6">
              Human Prompts · <a href="https://humanprompts.ai" style="color:#78716c;text-decoration:none">humanprompts.ai</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
