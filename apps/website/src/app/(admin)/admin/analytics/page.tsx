import { Eye, ShoppingCart, BarChart3, TrendingUp } from "lucide-react";
import { fetchAnalyticsKpis, fetchTopPrompts } from "@/lib/admin-stats";
import {
  AdminPageHeader,
  KpiCard,
  AdminCard,
  formatCents,
} from "@/components/admin/AdminShell";
import { CATEGORY_LABELS, type Category } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [kpis, top] = await Promise.all([
    fetchAnalyticsKpis(),
    fetchTopPrompts(10),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Real-time data"
        title="Analytics &amp; insights"
        subtitle="Track prompt views, conversions and revenue across the catalog."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total prompt views"
          value={kpis.totalViews.toLocaleString()}
          icon={Eye}
        />
        <KpiCard
          label="Conversions"
          value={kpis.conversions}
          hint={`${kpis.conversionPct}% conversion rate`}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Avg. order value"
          value={formatCents(kpis.avgOrderCents)}
          icon={BarChart3}
        />
        <KpiCard
          label="Catalog size"
          value={kpis.totalPrompts}
          hint="Live prompts on the site"
          icon={TrendingUp}
        />
      </div>

      <AdminCard title="Top performing prompts" subtitle="Click a row to view trends (coming soon)">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2 w-12">Rank</th>
              <th className="text-left font-medium px-3 py-2">Prompt</th>
              <th className="text-left font-medium px-3 py-2">Category</th>
              <th className="text-right font-medium px-3 py-2">Views</th>
              <th className="text-right font-medium px-5 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {top.map((p, i) => (
              <tr key={p.id} className="border-t border-border/40 hover:bg-card/30">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center justify-center h-6 w-7 rounded-md bg-foreground/5 border border-border/40 text-[11px] font-mono text-muted-foreground">
                    #{i + 1}
                  </span>
                </td>
                <td className="px-3 py-3">{p.title}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {p.categories
                    .map((c) => CATEGORY_LABELS[c as Category] ?? c)
                    .join(", ")}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {p.popularityCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {p.isFree ? "Free" : formatCents(p.priceCents)}
                </td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No analytics data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
