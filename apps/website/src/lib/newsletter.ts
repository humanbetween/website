import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  resend,
  sendNewSubscriberEmail,
  sendWelcomeLeadEmail,
} from "@/lib/resend";
import { postNewSubscriberToSlack } from "@/lib/slack";

export type NewsletterSource = "signup" | "checkout" | "footer" | "unknown";

export async function subscribeToNewsletter({
  email,
  name,
  source,
}: {
  email: string;
  name?: string;
  source: NewsletterSource;
}): Promise<{ created: boolean }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { created: false };

  const existing = (
    await db
      .select({ id: schema.newsletterSubscribers.id })
      .from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.email, normalized))
      .limit(1)
  )[0];
  if (existing) {
    await maybeSyncResendContact({ email: normalized, name }).catch(() => {});
    return { created: false };
  }

  await db
    .insert(schema.newsletterSubscribers)
    .values({ email: normalized, source })
    .onConflictDoNothing();

  await Promise.allSettled([
    maybeSyncResendContact({ email: normalized, name }).catch((err) => {
      console.error("resend audience sync failed", err);
    }),
    sendNewSubscriberEmail({ email: normalized, name, source }).catch((err) => {
      console.error("new subscriber email failed", err);
    }),
    sendWelcomeLeadEmail({ to: normalized }).catch((err) => {
      console.error("welcome lead email failed", err);
    }),
    postNewSubscriberToSlack({ email: normalized, name, source }).catch((err) => {
      console.error("subscriber slack notif failed", err);
    }),
  ]);

  return { created: true };
}

async function maybeSyncResendContact({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return;
  await resend.contacts.create({
    audienceId,
    email,
    firstName: name?.trim() || undefined,
    unsubscribed: false,
  });
}
