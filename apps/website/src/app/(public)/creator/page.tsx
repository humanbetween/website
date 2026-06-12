import Link from "next/link";
import { Users, BadgeCheck, Wallet, CalendarClock, Plus, Pencil } from "lucide-react";
import { requireCreator } from "@/lib/creator";
import {
  getCreatorStats,
  getReferredCustomers,
  getCreatorBalances,
  getCreatorPayouts,
} from "@/lib/affiliate";
import { getMySubmissions } from "@/lib/submissions";
import { ConnectPayoutsButton } from "./ConnectPayoutsButton";
import { appUrl } from "@/lib/stripe";
import { slugify } from "@/lib/prompts/slug";
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
import { ShareLinkButton } from "./ShareLinkButton";
import { CreatorAvatar } from "./CreatorAvatar";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const { account } = await requireCreator();
  const [stats, customers, submissions, balances, payouts] = await Promise.all([
    getCreatorStats(account.userId),
    getReferredCustomers(account.userId),
    getMySubmissions(account.userId),
    getCreatorBalances(account.userId),
    getCreatorPayouts(account.userId),
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

      <AdminCard title="Profile photo" className="p-5">
        <div className="px-5 pb-5 pt-1">
          <CreatorAvatar avatarUrl={account.avatarUrl} />
          <p className="text-xs text-muted-foreground mt-3">
            Shown on your products in the library. A default is used until you
            add one.
          </p>
        </div>
      </AdminCard>

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
          label="Available"
          value={formatCents(balances.availableCents)}
          hint={`${formatCents(balances.pendingCents)} pending`}
          icon={Wallet}
        />
        <KpiCard
          label="This month"
          value={formatCents(stats.earnedThisMonthCents)}
          hint={`${formatCents(stats.lifetimeEarnedCents)} lifetime`}
          icon={CalendarClock}
        />
      </div>

      <AdminCard title="Payouts">
        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Available
              </p>
              <p className="text-lg font-medium tabular-nums mt-1">
                {formatCents(balances.availableCents)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Pending (30-day hold)
              </p>
              <p className="text-lg font-medium tabular-nums mt-1 text-muted-foreground">
                {formatCents(balances.pendingCents)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Paid out
              </p>
              <p className="text-lg font-medium tabular-nums mt-1 text-muted-foreground">
                {formatCents(balances.paidCents)}
              </p>
            </div>
          </div>

          {account.payoutsEnabled ? (
            <p className="text-xs text-muted-foreground">
              ✅ Payouts active. Earnings are sent to your bank automatically about
              30 days after each sale (min {formatCents(1000)}).
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Set up payouts to get your earnings sent to your bank. Each
                commission is paid automatically ~30 days after the sale.
              </p>
              <ConnectPayoutsButton
                label={
                  account.stripeConnectAccountId
                    ? "Finish payout setup"
                    : "Set up payouts"
                }
              />
            </div>
          )}

          {payouts.length > 0 && (
            <div className="border-t border-border/40 pt-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                History
              </p>
              <ul className="divide-y divide-border/20">
                {payouts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="tabular-nums">{formatCents(p.amountCents)}</span>
                    <span className="text-muted-foreground">{statusBadge(p.status)}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(p.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard
        title="Your projects"
        subtitle="Upload a prompt or website — we review it before it goes live."
        right={
          <Link
            href="/creator/submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Submit a project
          </Link>
        }
      >
        {submissions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No projects yet. Submit your first one.
          </p>
        ) : (
          <ul className="divide-y divide-border/20">
            {submissions.map((s) => {
              const editable =
                s.submissionStatus === "pending" ||
                s.submissionStatus === "rejected";
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.title}</span>
                      {statusBadge(s.submissionStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(s.createdAt)}
                      {s.submissionStatus === "rejected" && s.reviewNotes
                        ? ` · ${s.reviewNotes}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.submissionStatus === "approved" && (
                      <ShareLinkButton
                        url={appUrl(`/r/${account.code}?p=${slugify(s.title)}`)}
                      />
                    )}
                    {editable && (
                      <Link
                        href={`/creator/submissions/${s.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

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
