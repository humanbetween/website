import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";
import { countPendingSubmissions } from "@/lib/submissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const pendingSubmissions = await countPendingSubmissions().catch(() => 0);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar pendingSubmissions={pendingSubmissions} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
