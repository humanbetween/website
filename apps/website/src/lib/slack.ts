type SlackBlock = Record<string, unknown>;

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
        { type: "mrkdwn", text: `*Name*\n${name}` },
        { type: "mrkdwn", text: `*Email*\n<mailto:${email}|${email}>` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Message*\n>${message.replace(/\n/g, "\n>")}` },
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
      body: JSON.stringify({ text: `New contact inquiry from ${name}`, blocks }),
    });
    if (!res.ok) {
      console.error("slack webhook returned", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack webhook post failed", err);
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
    { type: "mrkdwn", text: `*Email*\n<mailto:${email}|${email}>` },
  ];
  if (name) fields.push({ type: "mrkdwn", text: `*Name*\n${name}` });
  fields.push({ type: "mrkdwn", text: `*Source*\n${source}` });

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
