import Link from "next/link";
import { Users, BadgeCheck, Wallet, CalendarClock } from "lucide-react";
import { requireCreator } from "@/lib/creator";
import { getCreatorStats, getReferredCustomers } from "@/lib/affiliate";
import { appUrl } from "@/lib/stripe";
import {
  AdminPageHeader,
  AdminCard,
  KpiCard,
  formatCents,
  statusBadge,
  timeAgo,
} from "@/components/admin/AdminShell";
import { maskEmail } from "@/lib/utils";
import { ReferralLink } from "./ReferralLink";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const { account } = await requireCreator();
  const [stats, customers] = await Promise.all([
    getCreatorStats(account.userId),
    getReferredCustomers(account.userId),
  ]);
  const link = appUrl(`/r/${account.code}`);
  const suspended = account.status !== "active";

  return (
    <div className="container mx-auto max-w-5xl px-6 py-16 flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Creator program"
        title="Your referrals"
        subtitle="Share your link, earn on every sale you bring in."
        right={
          <Link
            href="/account"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Account →
          </Link>
        }
      />

      {suspended && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your creator account is paused. Existing commissions are safe — contact
          support to reactivate.
        </div>
      )}

      <AdminCard title="Your referral link" className="p-5">
        <div className="px-5 pb-5 pt-1 flex flex-col gap-2">
          <ReferralLink link={link} />
          <p className="text-xs text-muted-foreground">
            Anyone who arrives through this link is credited to you at checkout.
          </p>
        </div>
      </AdminCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Referred customers"
          value={stats.referredCustomers}
          icon={Users}
        />
        <KpiCard
          label="Active subscriptions"
          value={stats.activeSubscriptions}
          icon={BadgeCheck}
        />
        <KpiCard
          label="Balance"
          value={formatCents(stats.payableBalanceCents)}
          hint="Available to withdraw"
          icon={Wallet}
        />
        <KpiCard
          label="This month"
          value={formatCents(stats.earnedThisMonthCents)}
          hint={`${formatCents(stats.lifetimeEarnedCents)} lifetime`}
          icon={CalendarClock}
        />
      </div>

      <AdminCard
        title="Referred customers"
        subtitle="Emails are masked for privacy."
        right={
          <button
            type="button"
            disabled
            title="Bank withdrawals are coming soon"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground text-xs font-medium opacity-60 cursor-not-allowed"
          >
            <Wallet className="h-3.5 w-3.5" />
            Withdraw — coming soon
          </button>
        }
      >
        {customers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No referrals yet. Share your link to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="px-5 py-3 font-normal">Customer</th>
                  <th className="px-5 py-3 font-normal">Plan</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal">Referred</th>
                  <th className="px-5 py-3 font-normal text-right">Earned</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0">
                    <td className="px-5 py-3">{maskEmail(c.email)}</td>
                    <td className="px-5 py-3 capitalize">{c.tier}</td>
                    <td className="px-5 py-3">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {timeAgo(c.referredAt)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatCents(c.commissionCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
