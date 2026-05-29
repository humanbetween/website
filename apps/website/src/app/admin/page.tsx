import Link from "next/link";
import { desc, isNull } from "drizzle-orm";
import { Plus, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { db, schema } from "@/lib/db";
import { CATEGORY_LABELS, type Category } from "@/lib/prompts/types";
import { DeletePromptButton } from "@/components/admin/DeletePromptButton";

export const dynamic = "force-dynamic";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i;

export default async function AdminPromptsPage() {
  await requireAdmin();

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
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} live · soft-deleted rows are hidden
          </p>
        </div>
        <Link
          href="/admin/prompts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" /> New prompt
        </Link>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border/40">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-card/40">
            <tr>
              <Th className="w-20" />
              <Th>Title</Th>
              <Th>Categories</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Popularity</Th>
              <Th className="text-right">Created</Th>
              <Th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/40 hover:bg-card/30">
                <Td>
                  <RowThumb src={row.videoUrl} poster={row.thumbnailUrl} alt={row.title} />
                </Td>
                <Td>{row.title}</Td>
                <Td>
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
                </Td>
                <Td className="text-right tabular-nums">
                  {row.isFree ? "Free" : `$${(row.priceCents / 100).toFixed(2)}`}
                </Td>
                <Td className="text-right tabular-nums">{row.popularityCount}</Td>
                <Td className="text-right text-xs text-muted-foreground">
                  {row.createdAt.toISOString().slice(0, 10)}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/prompts/${row.id}/edit`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <DeletePromptButton id={row.id} title={row.title} />
                  </div>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={7}>
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No prompts yet. Create one to get started.
                  </p>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
    return (
      <div className="h-14 w-20 rounded-md bg-card border border-border/40" />
    );
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

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2 ${className ?? ""}`}>{children}</th>;
}
function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-3 py-3 align-middle ${className ?? ""}`}>
      {children}
    </td>
  );
}
