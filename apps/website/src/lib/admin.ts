import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in?redirect=/admin");
  }

  const rows = await db
    .select({ role: schema.profiles.role })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, session.user.id))
    .limit(1);

  const role = rows[0]?.role ?? "user";
  if (role !== "admin") {
    redirect("/");
  }

  return { session, role };
}

export async function isAdmin(userId: string) {
  const rows = await db
    .select({ role: schema.profiles.role })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);
  return (rows[0]?.role ?? "user") === "admin";
}
