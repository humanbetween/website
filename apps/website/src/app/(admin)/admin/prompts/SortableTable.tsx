"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CATEGORY_LABELS, type Category } from "@/lib/prompts/types";
import { DeletePromptButton } from "@/components/admin/DeletePromptButton";
import { formatCents, timeAgo } from "@/components/admin/AdminShell";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i;

export type AdminPromptRow = {
  id: string;
  title: string;
  categories: string[];
  priceCents: number;
  isFree: boolean;
  isPublished: boolean;
  popularityCount: number;
  createdAt: string;
  videoUrl: string;
  thumbnailUrl: string | null;
};

export function SortableTable({ initialRows }: { initialRows: AdminPromptRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persistOrder(ids: string[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/prompts/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Reorder failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setSaving(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);
    persistOrder(next.map((r) => r.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-2" />
            <th className="w-20 px-2 py-2" />
            <th className="text-left font-medium px-3 py-2">Title</th>
            <th className="text-left font-medium px-3 py-2">Categories</th>
            <th className="text-right font-medium px-3 py-2">Price</th>
            <th className="text-right font-medium px-3 py-2">Popularity</th>
            <th className="text-right font-medium px-3 py-2">Created</th>
            <th className="w-20 px-5 py-2" />
          </tr>
        </thead>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <tbody>
            {rows.map((row) => (
              <Row key={row.id} row={row} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No prompts yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </SortableContext>
      </table>
      {saving && (
        <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving order…
        </p>
      )}
    </DndContext>
  );
}

function Row({ row }: { row: AdminPromptRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "rgba(255,255,255,0.04)" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={
        "border-t border-border/40 hover:bg-card/30 " +
        (!row.isPublished ? "opacity-60" : "")
      }
    >
      <td className="px-3 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-card/60 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-3">
        <RowThumb src={row.videoUrl} poster={row.thumbnailUrl} alt={row.title} />
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-2">
          {row.title}
          {!row.isPublished && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-foreground/5 border border-border/40 text-muted-foreground">
              Hidden
            </span>
          )}
        </span>
      </td>
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
      <td className="px-3 py-3 text-right tabular-nums">{row.popularityCount}</td>
      <td className="px-3 py-3 text-right text-xs text-muted-foreground">
        {timeAgo(new Date(row.createdAt))}
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
        // eslint-disable-next-line @next/next/no-img-element
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
