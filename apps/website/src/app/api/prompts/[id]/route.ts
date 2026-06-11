import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { canAccessPrompt } from "@/lib/access";
import { db, schema } from "@/lib/db";
import { resolvePromptRef } from "@/lib/prompts/queries";
import type { Category, PromptDetail } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

// Accepts a UUID or a title slug.
const refSchema = z.string().min(1).max(120);

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = refSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad ref" }, { status: 400 });
  }

  try {
    const prompt = await resolvePromptRef(parsed.data);
    if (!prompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const viewerIsAdmin = session ? await isAdmin(session.user.id) : false;
    if (!prompt.isPublished && !viewerIsAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canAccess = await canAccessPrompt({
      isFree: prompt.isFree,
      promptId: prompt.id,
      userId: session?.user.id ?? null,
    });

    let creatorName: string | null = prompt.manualCreatorName || null;
    let creatorAvatarUrl: string | null = prompt.manualCreatorAvatarUrl || null;
    if (prompt.createdByUserId && (!creatorName || !creatorAvatarUrl)) {
      const [u, acct] = await Promise.all([
        db
          .select({ name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, prompt.createdByUserId))
          .limit(1),
        db
          .select({ avatarUrl: schema.affiliateAccounts.avatarUrl })
          .from(schema.affiliateAccounts)
          .where(eq(schema.affiliateAccounts.userId, prompt.createdByUserId))
          .limit(1),
      ]);
      creatorName = creatorName ?? u[0]?.name ?? null;
      creatorAvatarUrl = creatorAvatarUrl ?? acct[0]?.avatarUrl ?? null;
    }

    const payload: PromptDetail = {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      videoUrl: prompt.videoUrl,
      thumbnailUrl: prompt.thumbnailUrl,
      referenceImageUrl: prompt.referenceImageUrl,
      isFree: prompt.isFree,
      priceCents: prompt.priceCents,
      categories: prompt.categories as Category[],
      tags: prompt.tags,
      tools: prompt.tools,
      popularityCount: prompt.popularityCount,
      favoriteCount: prompt.favoriteCount,
      isPublished: prompt.isPublished,
      createdAt: prompt.createdAt.toISOString(),
      promptText: canAccess ? prompt.promptText : null,
      websiteUrl: canAccess ? prompt.websiteUrl : null,
      hasWebsite: !!prompt.websiteUrl,
      hasAudio: prompt.hasAudio,
      creatorName,
      creatorAvatarUrl,
      canAccess,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("get prompt failed", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
