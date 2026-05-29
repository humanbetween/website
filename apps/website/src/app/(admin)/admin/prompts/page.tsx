import Link from "next/link";
import { desc, isNull } from "drizzle-orm";
import { Plus, Pencil } from "lucide-react";
import { db, schema } from "@/lib/db";
import { CATEGORY_LABELS, type Category } from "@/lib/prompts/types";
import { DeletePromptButton } from "@/components/admin/DeletePromptButton";
import {
  AdminPageHeader,
  AdminCard,
  formatCents,
  timeAgo,
} from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i;

export default async function AdminPromptsListPage() {
  let rows: Array<{
    id: string;
    title: string;
    categories: string[];
    priceCents: number;
    isFree: boolean;
    popularityCount: number;
    createdAt: Date;
    videoUrl: string;
    thumbnailUrl: string | null;
  }> = [];
  try {
    rows = await db
      .select({
        id: schema.prompts.id,
        title: schema.prompts.title,
        categories: schema.prompts.categories,
        priceCents: schema.prompts.priceCents,
        isFree: schema.prompts.isFree,
        popularityCount: schema.prompts.popularityCount,
        createdAt: schema.prompts.createdAt,
        videoUrl: schema.prompts.videoUrl,
        thumbnailUrl: schema.prompts.thumbnailUrl,
      })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt))
      .orderBy(desc(schema.prompts.createdAt));
  } catch (err) {
    console.error("admin list failed", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Content"
        title="Prompts"
        subtitle={`${rows.length} live · soft-deleted rows are hidden.`}
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
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
            <tr>
              <th className="w-20 px-5 py-2" />
              <th className="text-left font-medium px-3 py-2">Title</th>
              <th className="text-left font-medium px-3 py-2">Categories</th>
              <th className="text-right font-medium px-3 py-2">Price</th>
              <th className="text-right font-medium px-3 py-2">Popularity</th>
              <th className="text-right font-medium px-3 py-2">Created</th>
              <th className="w-20 px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border/40 hover:bg-card/30"
              >
                <td className="px-5 py-3">
                  <RowThumb
                    src={row.videoUrl}
                    poster={row.thumbnailUrl}
                    alt={row.title}
                  />
                </td>
                <td className="px-3 py-3">{row.title}</td>
                <td className="px-3 py-3">
                  <span className="flex flex-wrap gap-1">
                    {row.categories.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-secondary border border-border/40 text-muted-foreground"
                      >
                        {CATEGORY_LABELS[c as Category] ?? c}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {row.isFree ? "Free" : formatCents(row.priceCents)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {row.popularityCount}
                </td>
                <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                  {timeAgo(row.createdAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/prompts/${row.id}/edit`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <DeletePromptButton id={row.id} title={row.title} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No prompts yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}

function RowThumb({
  src,
  poster,
  alt,
}: {
  src: string;
  poster: string | null;
  alt: string;
}) {
  if (!src) {
    return <div className="h-14 w-20 rounded-md bg-card border border-border/40" />;
  }
  const isImage = IMAGE_RE.test(src);
  return (
    <div className="relative h-14 w-20 rounded-md overflow-hidden bg-card border border-border/40">
      {isImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          src={src}
          poster={poster ?? undefined}
          muted
          playsInline
          preload="metadata"
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
