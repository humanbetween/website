import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getFavoritePromptIds(
  userId: string | null,
): Promise<string[]> {
  if (!userId) return [];
  const rows = await db
    .select({ promptId: schema.favorites.promptId })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId));
  return rows.map((r) => r.promptId);
}
