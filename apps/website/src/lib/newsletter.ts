import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { resend } from "@/lib/resend";

export type NewsletterSource = "signup" | "checkout" | "footer" | "unknown";

export async function subscribeToNewsletter({
  email,
  source,
}: {
  email: string;
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
    // Already in our DB. Still try to upsert into Resend in case it was missing.
    await maybeSyncResendContact(normalized).catch(() => {});
    return { created: false };
  }

  await db
    .insert(schema.newsletterSubscribers)
    .values({ email: normalized, source })
    .onConflictDoNothing();

  await maybeSyncResendContact(normalized).catch((err) => {
    console.error("resend audience sync failed", err);
  });

  return { created: true };
}

async function maybeSyncResendContact(email: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return;
  await resend.contacts.create({
    audienceId,
    email,
    unsubscribed: false,
  });
}
