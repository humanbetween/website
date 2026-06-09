import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CreatorSubmitValues } from "@/lib/prompts/schema";

const EDITABLE_STATUSES = ["pending", "rejected"] as const;

/** Creator creates a new submission. Server forces the gated fields. */
export async function createSubmission(
  userId: string,
  values: CreatorSubmitValues,
): Promise<string | null> {
  const [row] = await db
    .insert(schema.prompts)
    .values({
      title: values.title,
      description: values.description,
      promptText: values.promptText,
      websiteUrl: values.websiteUrl ?? null,
      videoUrl: values.videoUrl,
      thumbnailUrl: values.thumbnailUrl ?? null,
      referenceImageUrl: values.referenceImageUrl ?? null,
      assets: values.assets,
      categories: values.categories,
      tags: values.tags,
      tools: values.tools,
      // Forced server-side: creator content is subscription-gated and unlisted
      // until an admin approves it.
      priceCents: 0,
      isFree: false,
      isPublished: false,
      createdByUserId: userId,
      submissionStatus: "pending",
    })
    .returning({ id: schema.prompts.id });
  return row?.id ?? null;
}

/** Edit own submission (only while pending/rejected); editing re-queues it. */
export async function updateOwnSubmission(
  userId: string,
  id: string,
  patch: Partial<CreatorSubmitValues>,
): Promise<boolean> {
  const rows = await db
    .update(schema.prompts)
    .set({
      ...patch,
      websiteUrl: patch.websiteUrl ?? null,
      submissionStatus: "pending",
      reviewNotes: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.prompts.id, id),
        eq(schema.prompts.createdByUserId, userId),
        inArray(schema.prompts.submissionStatus, [...EDITABLE_STATUSES]),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .returning({ id: schema.prompts.id });
  return rows.length > 0;
}

export async function deleteOwnSubmission(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .update(schema.prompts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(schema.prompts.id, id),
        eq(schema.prompts.createdByUserId, userId),
        inArray(schema.prompts.submissionStatus, [...EDITABLE_STATUSES]),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .returning({ id: schema.prompts.id });
  return rows.length > 0;
}

export async function getMySubmissions(userId: string) {
  return db
    .select({
      id: schema.prompts.id,
      title: schema.prompts.title,
      thumbnailUrl: schema.prompts.thumbnailUrl,
      videoUrl: schema.prompts.videoUrl,
      submissionStatus: schema.prompts.submissionStatus,
      reviewNotes: schema.prompts.reviewNotes,
      websiteUrl: schema.prompts.websiteUrl,
      createdAt: schema.prompts.createdAt,
    })
    .from(schema.prompts)
    .where(
      and(
        eq(schema.prompts.createdByUserId, userId),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .orderBy(desc(schema.prompts.createdAt));
}

/** Full row for the edit form — own, still editable. */
export async function getSubmissionForEdit(id: string, userId: string) {
  const rows = await db
    .select()
    .from(schema.prompts)
    .where(
      and(
        eq(schema.prompts.id, id),
        eq(schema.prompts.createdByUserId, userId),
        inArray(schema.prompts.submissionStatus, [...EDITABLE_STATUSES]),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getPendingSubmissions() {
  return db
    .select({
      id: schema.prompts.id,
      title: schema.prompts.title,
      description: schema.prompts.description,
      thumbnailUrl: schema.prompts.thumbnailUrl,
      videoUrl: schema.prompts.videoUrl,
      referenceImageUrl: schema.prompts.referenceImageUrl,
      websiteUrl: schema.prompts.websiteUrl,
      promptText: schema.prompts.promptText,
      categories: schema.prompts.categories,
      tags: schema.prompts.tags,
      tools: schema.prompts.tools,
      createdAt: schema.prompts.createdAt,
      creatorName: schema.users.name,
      creatorEmail: schema.users.email,
    })
    .from(schema.prompts)
    .leftJoin(schema.users, eq(schema.users.id, schema.prompts.createdByUserId))
    .where(
      and(
        eq(schema.prompts.submissionStatus, "pending"),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .orderBy(asc(schema.prompts.createdAt));
}

export async function countPendingSubmissions(): Promise<number> {
  try {
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.prompts)
      .where(
        and(
          eq(schema.prompts.submissionStatus, "pending"),
          isNull(schema.prompts.deletedAt),
        ),
      );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

type ReviewResult = {
  id: string;
  title: string;
  createdByUserId: string | null;
} | null;

/** Approve → publish, and prepend it in the grid like an admin-created prompt. */
export async function approveSubmission(id: string): Promise<ReviewResult> {
  const minRow = (
    await db
      .select({ min: sql<number>`coalesce(min(${schema.prompts.displayOrder}), 0)` })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt))
  )[0];
  const displayOrder = (minRow?.min ?? 0) - 1;

  const rows = await db
    .update(schema.prompts)
    .set({
      submissionStatus: "approved",
      isPublished: true,
      reviewNotes: null,
      displayOrder,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.prompts.id, id),
        eq(schema.prompts.submissionStatus, "pending"),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .returning({
      id: schema.prompts.id,
      title: schema.prompts.title,
      createdByUserId: schema.prompts.createdByUserId,
    });
  return rows[0] ?? null;
}

export async function rejectSubmission(
  id: string,
  notes: string,
): Promise<ReviewResult> {
  const rows = await db
    .update(schema.prompts)
    .set({
      submissionStatus: "rejected",
      isPublished: false,
      reviewNotes: notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.prompts.id, id),
        eq(schema.prompts.submissionStatus, "pending"),
        isNull(schema.prompts.deletedAt),
      ),
    )
    .returning({
      id: schema.prompts.id,
      title: schema.prompts.title,
      createdByUserId: schema.prompts.createdByUserId,
    });
  return rows[0] ?? null;
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const rows = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return rows[0]?.email ?? null;
}
