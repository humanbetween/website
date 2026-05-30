/**
 * One-shot data migration: rename the BACKGROUND category to SKILLS on
 * every existing prompt row.
 *
 * Run with:
 *   cd apps/website && bun run src/db/migrate-background-to-skills.ts
 *
 * Idempotent — re-running it after the rename is a no-op.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  const before = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM prompts WHERE 'BACKGROUND' = ANY(categories) AND deleted_at IS NULL`,
  );
  const beforeCount = Number(before.rows?.[0]?.count ?? 0);
  console.log(`[migrate] ${beforeCount} live prompts contain BACKGROUND`);

  if (beforeCount === 0) {
    console.log("[migrate] nothing to do");
    return;
  }

  await db.execute(
    sql`UPDATE prompts SET categories = array_replace(categories, 'BACKGROUND', 'SKILLS')`,
  );

  const after = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM prompts WHERE 'BACKGROUND' = ANY(categories)`,
  );
  const afterCount = Number(after.rows?.[0]?.count ?? 0);
  console.log(
    `[migrate] done — ${beforeCount} rows updated, ${afterCount} still contain BACKGROUND (should be 0)`,
  );
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
