import { Users, UserCheck, DollarSign, TrendingUp, Mail } from "lucide-react";
import { fetchCustomers, fetchCustomersKpis } from "@/lib/admin-stats";
import {
  AdminPageHeader,
  KpiCard,
  formatCents,
  timeAgo,
  statusBadge,
} from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || null;

  const [kpis, customers] = await Promise.all([
    fetchCustomersKpis(),
    fetchCustomers(search),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Customer relations"
        title="Your customers"
        subtitle="View and manage every account on Human Between."
        right={
          <form>
            <input
              type="search"
              name="q"
              defaultValue={search ?? ""}
              placeholder="Search by name or email"
              className="w-64 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-xs focus:outline-none focus:border-foreground/40"
            />
          </form>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total customers"
          value={kpis.totalCustomers}
          icon={Users}
        />
        <KpiCard
          label="Active subscribers"
          value={kpis.activeSubscribers}
          icon={UserCheck}
        />
        <KpiCard
          label="Total revenue"
          value={formatCents(kpis.revenueCents)}
          icon={DollarSign}
        />
        <KpiCard
          label="Avg. spend / customer"
          value={formatCents(kpis.avgOrderCents)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.map((c) => {
          const initial = (c.name ?? c.email).slice(0, 1).toUpperCase();
          return (
            <article
              key={c.id}
              className="rounded-2xl border border-border/40 bg-card/40 p-5 flex flex-col gap-4"
            >
              <header className="flex items-start justify-between gap-3">
                <span className="h-10 w-10 rounded-full bg-foreground text-background inline-flex items-center justify-center text-sm font-medium">
                  {initial}
                </span>
                {statusBadge(c.subscriptionStatus ?? "inactive")}
              </header>
              <div className="min-w-0">
                <h3 className="text-base font-medium truncate">
                  {c.name ?? "—"}
                </h3>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="h-3 w-3" /> {c.email}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                <div>
                  <dt className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                    Orders
                  </dt>
                  <dd className="text-lg font-medium mt-0.5 tabular-nums">
                    {c.ordersCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                    Total spent
                  </dt>
                  <dd className="text-lg font-medium mt-0.5 tabular-nums">
                    {formatCents(c.spentCents)}
                  </dd>
                </div>
              </dl>
              <p className="text-[11px] text-muted-foreground">
                Last order: {timeAgo(c.lastOrderAt)} · Joined {timeAgo(c.createdAt)}
              </p>
            </article>
          );
        })}
        {customers.length === 0 && (
          <div className="col-span-full rounded-2xl border border-border/40 bg-card/40 px-5 py-16 text-center text-sm text-muted-foreground">
            No customers match your search.
          </div>
        )}
      </div>
    </div>
  );
}
