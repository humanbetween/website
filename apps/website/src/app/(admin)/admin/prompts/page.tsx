import Link from "next/link";
import { asc, desc, isNull } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/lib/db";
import { AdminPageHeader, AdminCard } from "@/components/admin/AdminShell";
import { SortableTable, type AdminPromptRow } from "./SortableTable";

export const dynamic = "force-dynamic";

export default async function AdminPromptsListPage() {
  let rows: AdminPromptRow[] = [];
  try {
    const raw = await db
      .select({
        id: schema.prompts.id,
        title: schema.prompts.title,
        categories: schema.prompts.categories,
        priceCents: schema.prompts.priceCents,
        isFree: schema.prompts.isFree,
        isPublished: schema.prompts.isPublished,
        popularityCount: schema.prompts.popularityCount,
        createdAt: schema.prompts.createdAt,
        videoUrl: schema.prompts.videoUrl,
        thumbnailUrl: schema.prompts.thumbnailUrl,
      })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt))
      .orderBy(asc(schema.prompts.displayOrder), desc(schema.prompts.createdAt));
    rows = raw.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  } catch (err) {
    console.error("admin list failed", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Content"
        title="Prompts"
        subtitle={`${rows.length} live · drag the handle to reorder · public library follows this order.`}
        right={
          <Link
            href="/admin/prompts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" /> New prompt
          </Link>
        }
      />

      <AdminCard>
        <SortableTable initialRows={rows} />
      </AdminCard>
    </div>
  );
}
