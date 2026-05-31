import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

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
  if (existing) return { created: false };

  await db
    .insert(schema.newsletterSubscribers)
    .values({ email: normalized, source })
    .onConflictDoNothing();
  return { created: true };
}
