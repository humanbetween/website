import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  AdminPageHeader,
  AdminCard,
  timeAgo,
} from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

export default async function AdminFavoritesPage() {
  const [rows, perUserRaw] = await Promise.all([
    db
      .select({
        userId: schema.favorites.userId,
        promptId: schema.favorites.promptId,
        createdAt: schema.favorites.createdAt,
        userEmail: schema.users.email,
        userName: schema.users.name,
        promptTitle: schema.prompts.title,
      })
      .from(schema.favorites)
      .leftJoin(schema.users, eq(schema.users.id, schema.favorites.userId))
      .leftJoin(schema.prompts, eq(schema.prompts.id, schema.favorites.promptId))
      .orderBy(desc(schema.favorites.createdAt))
      .limit(PAGE_SIZE)
      .catch(() => []),
    db
      .select({
        userId: schema.favorites.userId,
        userEmail: schema.users.email,
        userName: schema.users.name,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(schema.favorites)
      .leftJoin(schema.users, eq(schema.users.id, schema.favorites.userId))
      .groupBy(
        schema.favorites.userId,
        schema.users.email,
        schema.users.name,
      )
      .orderBy(sql`count(*) desc`)
      .limit(50)
      .catch(() => []),
  ]);

  const perUser = perUserRaw as Array<{
    userId: string;
    userEmail: string | null;
    userName: string | null;
    count: number;
  }>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Engagement"
        title="Favorites"
        subtitle={`${rows.length} most recent · ${perUser.length} unique users with at least one favorite.`}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <AdminCard className="md:col-span-1">
          <div className="px-5 py-4 border-b border-border/40">
            <h2 className="text-sm font-medium">Top users</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              By number of favorites
            </p>
          </div>
          <ul className="divide-y divide-border/40">
            {perUser.length === 0 && (
              <li className="px-5 py-8 text-sm text-muted-foreground text-center">
                No favorites yet.
              </li>
            )}
            {perUser.map((u) => (
              <li
                key={u.userId}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{u.userName || u.userEmail || u.userId}</p>
                  {u.userName && u.userEmail && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {u.userEmail}
                    </p>
                  )}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-mono bg-foreground/5 border border-border/40 text-muted-foreground tabular-nums">
                  {u.count}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard className="md:col-span-2">
          <div className="px-5 py-4 border-b border-border/40">
            <h2 className="text-sm font-medium">Recent activity</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Latest {PAGE_SIZE} favorite events
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2">User</th>
                <th className="text-left font-medium px-3 py-2">Prompt</th>
                <th className="text-right font-medium px-5 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No favorites yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={`${r.userId}_${r.promptId}_${r.createdAt.toISOString()}`}
                  className="border-t border-border/40 hover:bg-card/30"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm">{r.userName || r.userEmail || r.userId}</p>
                    {r.userName && r.userEmail && (
                      <p className="text-[11px] text-muted-foreground">
                        {r.userEmail}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/prompts/${r.promptId}/edit`}
                      className="hover:underline"
                    >
                      {r.promptTitle ?? r.promptId}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      </div>
    </div>
  );
}
