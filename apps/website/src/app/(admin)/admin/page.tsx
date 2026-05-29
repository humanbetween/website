import { headers } from "next/headers";
import Link from "next/link";
import {
  DollarSign,
  Crown,
  Users,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  fetchOverviewKpis,
  fetchRecentPurchases,
  fetchRecentSignups,
} from "@/lib/admin-stats";
import {
  AdminPageHeader,
  KpiCard,
  AdminCard,
  formatCents,
  timeAgo,
} from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  const [kpis, purchases, signups] = await Promise.all([
    fetchOverviewKpis(),
    fetchRecentPurchases(5),
    fetchRecentSignups(5),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Dashboard overview"
        title={`Welcome back, ${firstName}.`}
        subtitle="Here's what's happening with Human Between today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total revenue"
          value={formatCents(kpis.revenueCents)}
          icon={DollarSign}
        />
        <KpiCard
          label="Active subscribers"
          value={kpis.activeSubscribers}
          icon={Crown}
        />
        <KpiCard
          label="Total customers"
          value={kpis.totalCustomers}
          icon={Users}
        />
        <KpiCard
          label="Prompts live"
          value={kpis.totalPrompts}
          icon={Sparkles}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <AdminCard
          title="Recent orders"
          subtitle="Latest 5 transactions"
          right={
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2">Customer</th>
                <th className="text-left font-medium px-3 py-2">Prompt</th>
                <th className="text-right font-medium px-3 py-2">Amount</th>
                <th className="text-right font-medium px-5 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-5 py-3">
                    <div className="text-sm">{p.userName ?? p.userEmail ?? "—"}</div>
                    {p.userEmail && p.userName && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.userEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    {p.promptTitle ?? (p.type === "subscription_renewal" ? "Subscription" : "Lifetime")}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCents(p.amountCents)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {timeAgo(p.createdAt)}
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminCard>

        <AdminCard title="Activity" subtitle="Recent events">
          <ul className="divide-y divide-border/40">
            {signups.map((s) => (
              <li key={s.id} className="px-5 py-3 flex items-start gap-3">
                <span className="h-7 w-7 rounded-md bg-foreground/5 border border-border/40 inline-flex items-center justify-center text-muted-foreground shrink-0">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    {s.name ?? s.email} signed up
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {timeAgo(s.createdAt)}
                  </p>
                </div>
              </li>
            ))}
            {purchases.slice(0, 3).map((p) => (
              <li key={`p-${p.id}`} className="px-5 py-3 flex items-start gap-3">
                <span className="h-7 w-7 rounded-md bg-foreground/5 border border-border/40 inline-flex items-center justify-center text-muted-foreground shrink-0">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    {p.userName ?? p.userEmail ?? "Someone"} purchased{" "}
                    <span className="text-muted-foreground">
                      {p.promptTitle ?? p.type.replace("_", " ")}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {timeAgo(p.createdAt)}
                  </p>
                </div>
              </li>
            ))}
            {signups.length === 0 && purchases.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                Quiet so far.
              </li>
            )}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}
