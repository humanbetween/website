import { AdminPageHeader, AdminCard } from "@/components/admin/AdminShell";
import { getPendingSubmissions } from "@/lib/submissions";
import { SubmissionsReview } from "./SubmissionsReview";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const rows = await getPendingSubmissions();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <AdminPageHeader
        eyebrow="Creator program"
        title="Submissions"
        subtitle="Review creator uploads before they go live in the library."
      />
      <AdminCard
        title={`Pending review${rows.length ? ` (${rows.length})` : ""}`}
        className="p-4"
      >
        <div className="p-1">
          <SubmissionsReview rows={rows} />
        </div>
      </AdminCard>
    </div>
  );
}
