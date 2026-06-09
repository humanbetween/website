import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCreator } from "@/lib/creator";
import { getSubmissionForEdit } from "@/lib/submissions";
import { PromptForm } from "@/components/admin/PromptForm";
import type { Category } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await requireCreator();
  const { id } = await params;

  const prompt = await getSubmissionForEdit(id, session.user.id).catch(() => null);
  if (!prompt) notFound();

  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/creator"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-medium">Edit submission</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saving sends it back for review.
        </p>
      </header>

      {prompt.submissionStatus === "rejected" && prompt.reviewNotes && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive mb-1">Changes requested</p>
          <p className="text-foreground/80 whitespace-pre-wrap">
            {prompt.reviewNotes}
          </p>
        </div>
      )}

      <PromptForm
        mode="edit"
        audience="creator"
        initial={{
          id: prompt.id,
          title: prompt.title,
          description: prompt.description,
          promptText: prompt.promptText ?? "",
          websiteUrl: prompt.websiteUrl,
          videoUrl: prompt.videoUrl,
          thumbnailUrl: prompt.thumbnailUrl,
          referenceImageUrl: prompt.referenceImageUrl,
          assets: prompt.assets,
          categories: prompt.categories as Category[],
          tags: prompt.tags,
          tools: prompt.tools,
        }}
      />
    </div>
  );
}
