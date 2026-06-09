type SlackBlock = Record<string, unknown>;

// Escape the three chars Slack mrkdwn treats specially, so user-supplied text
// can't inject links/formatting (e.g. <https://evil|click>) into our channel.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function postContactInquiryToSlack({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const url = process.env.SLACK_CONTACT_WEBHOOK_URL;
  if (!url) return;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "📩 New contact inquiry", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name*\n${esc(name)}` },
        { type: "mrkdwn", text: `*Email*\n<mailto:${email}|${esc(email)}>` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message*\n>${esc(message).replace(/\n/g, "\n>")}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Reply via email", emoji: true },
          url: `mailto:${email}?subject=${encodeURIComponent("Re: your message to Human Prompts")}`,
        },
      ],
    },
  ];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New contact inquiry from ${esc(name)}`,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error("slack webhook returned", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack webhook post failed", err);
  }
}

export async function postNewSubmissionToSlack({
  title,
  creatorEmail,
  type,
}: {
  title: string;
  creatorEmail: string;
  type: "Prompt" | "Website";
}) {
  // Dedicated submissions channel for the team to review creator uploads.
  const url = process.env.SLACK_SUBMISSIONS_WEBHOOK_URL;
  if (!url) return;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "📥 New project to review", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Title*\n${esc(title)}` },
        { type: "mrkdwn", text: `*Type*\n${type}` },
        { type: "mrkdwn", text: `*Creator*\n<mailto:${creatorEmail}|${esc(creatorEmail)}>` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Review submission", emoji: true },
          style: "primary",
          url: "https://humanprompts.ai/admin/submissions",
        },
      ],
    },
  ];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New project to review: ${esc(title)}`,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error("slack webhook returned", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack submission post failed", err);
  }
}

export async function postNewSubscriberToSlack({
  email,
  name,
  source,
}: {
  email: string;
  name?: string;
  source: string;
}) {
  // Dedicated subscribers channel — intentionally separate from the
  // contact-inquiry channel (SLACK_CONTACT_WEBHOOK_URL).
  const url = process.env.SLACK_SUBSCRIBERS_WEBHOOK_URL;
  if (!url) return;

  const fields: SlackBlock[] = [
    { type: "mrkdwn", text: `*Email*\n<mailto:${email}|${esc(email)}>` },
  ];
  if (name) fields.push({ type: "mrkdwn", text: `*Name*\n${esc(name)}` });
  fields.push({ type: "mrkdwn", text: `*Source*\n${esc(source)}` });

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "🎉 New newsletter subscriber", emoji: true },
    },
    { type: "section", fields },
  ];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `New subscriber: ${email}`, blocks }),
    });
    if (!res.ok) {
      console.error("slack webhook returned", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack subscriber post failed", err);
  }
}
