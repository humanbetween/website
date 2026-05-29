/**
 * Promote a user to the admin role.
 *
 * Run with: DATABASE_URL=... bun run src/db/promote-admin.ts <email>
 */

import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: bun run src/db/promote-admin.ts <email>");
    process.exit(1);
  }

  const user = (
    await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  )[0];

  if (!user) {
    console.error(`[promote-admin] no user found with email ${email}`);
    process.exit(1);
  }

  await db
    .insert(schema.profiles)
    .values({ userId: user.id, role: "admin" })
    .onConflictDoUpdate({
      target: schema.profiles.userId,
      set: { role: "admin", updatedAt: new Date() },
    });

  console.log(`[promote-admin] ${email} (${user.id}) is now an admin.`);
}

main().catch((err) => {
  console.error("[promote-admin] failed:", err);
  process.exit(1);
});
