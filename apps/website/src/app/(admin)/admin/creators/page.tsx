import { AdminPageHeader, AdminCard, KpiCard, formatCents } from "@/components/admin/AdminShell";
import { Megaphone, Wallet, Users } from "lucide-react";
import { getAdminAffiliates } from "@/lib/affiliate";
import { CreatorsTable } from "./CreatorsTable";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  const rows = await getAdminAffiliates();
  const totalOwed = rows.reduce((s, r) => s + r.payableCents, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.referredCustomers, 0);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <AdminPageHeader
        eyebrow="Affiliate program"
        title="Creators"
        subtitle="Referral codes, attributed customers, and commissions owed."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Creators" value={rows.length} icon={Megaphone} />
        <KpiCard
          label="Referred customers"
          value={totalCustomers}
          icon={Users}
        />
        <KpiCard
          label="Commissions owed"
          value={formatCents(totalOwed)}
          hint="Payable balance across all creators"
          icon={Wallet}
        />
      </div>

      <AdminCard title="All creators">
        <CreatorsTable rows={rows} />
      </AdminCard>
    </div>
  );
}
