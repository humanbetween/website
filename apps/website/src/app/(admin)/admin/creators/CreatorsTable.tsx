"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCents, statusBadge } from "@/components/admin/AdminShell";
import type { AdminAffiliateRow } from "@/lib/affiliate";

export function CreatorsTable({ rows }: { rows: AdminAffiliateRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(userId: string, body: Record<string, unknown>) {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...body }),
      });
      if (!res.ok) throw new Error("update failed");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  }

  function editRate(row: AdminAffiliateRow) {
    const input = window.prompt(
      `Commission rate for ${row.email ?? row.code} (in %)`,
      String(row.commissionRateBps / 100),
    );
    if (input === null) return;
    const pct = Number(input);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a percentage between 0 and 100");
      return;
    }
    patch(row.userId, { commissionRateBps: Math.round(pct * 100) });
  }

  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        No creators yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/40">
            <th className="px-5 py-3 font-normal">Creator</th>
            <th className="px-5 py-3 font-normal">Code</th>
            <th className="px-5 py-3 font-normal">Rate</th>
            <th className="px-5 py-3 font-normal text-right">Customers</th>
            <th className="px-5 py-3 font-normal text-right">Owed</th>
            <th className="px-5 py-3 font-normal text-right">Lifetime</th>
            <th className="px-5 py-3 font-normal">Payouts</th>
            <th className="px-5 py-3 font-normal">Status</th>
            <th className="px-5 py-3 font-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-border/20 last:border-0">
              <td className="px-5 py-3">
                <div className="font-medium">{r.name || "—"}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </td>
              <td className="px-5 py-3 font-mono text-xs">{r.code}</td>
              <td className="px-5 py-3 tabular-nums">
                {r.commissionRateBps / 100}%
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {r.referredCustomers}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {formatCents(r.payableCents)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                {formatCents(r.lifetimeCents)}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <span
                  className={
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider " +
                    (r.payoutsEnabled
                      ? "bg-foreground text-background"
                      : "bg-card/60 border border-border/60 text-muted-foreground")
                  }
                >
                  {r.payoutsEnabled ? "Active" : "Not set up"}
                </span>
                {r.paidCents > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                    {formatCents(r.paidCents)} paid
                  </span>
                )}
              </td>
              <td className="px-5 py-3">{statusBadge(r.status)}</td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => editRate(r)}
                    disabled={busy === r.userId}
                    className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
                  >
                    Rate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patch(r.userId, {
                        status: r.status === "active" ? "suspended" : "active",
                      })
                    }
                    disabled={busy === r.userId}
                    className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
                  >
                    {r.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
