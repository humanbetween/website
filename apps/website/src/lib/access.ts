import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type AccessContext = {
  isFree: boolean;
  promptId: string;
  userId: string | null;
};

export async function canAccessPrompt(ctx: AccessContext): Promise<boolean> {
  if (ctx.isFree) return true;
  if (!ctx.userId) return false;

  const profile = (
    await db
      .select({
        status: schema.profiles.subscriptionStatus,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, ctx.userId))
      .limit(1)
  )[0];

  if (profile?.status === "active") return true;

  const owned = await db
    .select({ id: schema.purchases.id })
    .from(schema.purchases)
    .where(
      and(
        eq(schema.purchases.userId, ctx.userId),
        eq(schema.purchases.promptId, ctx.promptId),
      ),
    )
    .limit(1);

  return owned.length > 0;
}
