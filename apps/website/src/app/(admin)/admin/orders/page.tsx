import { ShoppingBag, DollarSign, Activity, CheckCircle } from "lucide-react";
import { fetchOrders, fetchOrdersKpis, type Range } from "@/lib/admin-stats";
import {
  AdminPageHeader,
  KpiCard,
  AdminCard,
  formatCents,
  timeAgo,
} from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

const VALID_RANGES = new Set<Range>([7, 30, 90]);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const rawRange = Number(sp.range ?? 30) as Range;
  const range: Range = VALID_RANGES.has(rawRange) ? rawRange : 30;
  const search = sp.q?.trim() || null;

  const [kpis, orders] = await Promise.all([
    fetchOrdersKpis(),
    fetchOrders({ range, search }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Order management"
        title="All orders"
        subtitle="Track and manage every purchase in one place."
        right={
          <form className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={search ?? ""}
              placeholder="Search by customer or prompt"
              className="w-64 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-xs focus:outline-none focus:border-foreground/40"
            />
            <select
              name="range"
              defaultValue={String(range)}
              className="px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-xs"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Apply
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total orders" value={kpis.total} icon={ShoppingBag} />
        <KpiCard
          label="Revenue"
          value={formatCents(kpis.revenueCents)}
          icon={DollarSign}
        />
        <KpiCard label="One-time" value={kpis.oneTime} icon={Activity} />
        <KpiCard
          label="Subscription renewals"
          value={kpis.subscriptions}
          icon={CheckCircle}
        />
      </div>

      <AdminCard
        title="Orders list"
        subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"} found`}
      >
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2">Order</th>
              <th className="text-left font-medium px-3 py-2">Customer</th>
              <th className="text-left font-medium px-3 py-2">Type</th>
              <th className="text-right font-medium px-3 py-2">Amount</th>
              <th className="text-right font-medium px-5 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border/40 hover:bg-card/30">
                <td className="px-5 py-3">
                  <div className="text-sm">
                    {o.promptTitle ??
                      (o.type === "subscription_renewal"
                        ? "Subscription renewal"
                        : "Lifetime")}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    {o.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm">{o.userName ?? o.userEmail ?? "—"}</div>
                  {o.userEmail && o.userName && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {o.userEmail}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {o.type === "subscription_renewal"
                    ? "Subscription"
                    : o.type === "lifetime"
                      ? "Lifetime"
                      : "One-time"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCents(o.amountCents)}
                </td>
                <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                  {timeAgo(o.createdAt)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No orders match your criteria yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
