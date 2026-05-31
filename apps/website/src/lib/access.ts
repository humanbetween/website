import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export type AccessContext = {
  isFree: boolean;
  promptId: string;
  userId: string | null;
};

export async function hasUnlimitedAccess(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const profile = (
    await db
      .select({ status: schema.profiles.subscriptionStatus })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1)
  )[0];
  return profile?.status === "active";
}

export async function getCurrentAccess(): Promise<{
  userId: string | null;
  hasUnlimited: boolean;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? null;
  const hasUnlimited = await hasUnlimitedAccess(userId);
  return { userId, hasUnlimited };
}

export async function canAccessPrompt(ctx: AccessContext): Promise<boolean> {
  if (ctx.isFree) return true;
  if (!ctx.userId) return false;

  if (await hasUnlimitedAccess(ctx.userId)) return true;

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
