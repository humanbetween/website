import { notFound } from "next/navigation";
import { getPromptById } from "@/lib/prompts/queries";
import { PromptForm } from "@/components/admin/PromptForm";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import type { Category } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let prompt;
  try {
    prompt = await getPromptById(id);
  } catch (err) {
    console.error("getPromptById failed", err);
    notFound();
  }
  if (!prompt) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Content"
        title="Edit prompt"
        subtitle="Changes go live as soon as you save."
      />
      <PromptForm
        mode="edit"
        initial={{
          id: prompt.id,
          title: prompt.title,
          description: prompt.description,
          promptText: prompt.promptText ?? "",
          websiteUrl: prompt.websiteUrl,
          priceCents: prompt.priceCents,
          isFree: prompt.isFree,
          videoUrl: prompt.videoUrl,
          thumbnailUrl: prompt.thumbnailUrl,
          referenceImageUrl: prompt.referenceImageUrl,
          hasAudio: prompt.hasAudio,
          assets: prompt.assets,
          categories: prompt.categories as Category[],
          tags: prompt.tags,
          tools: prompt.tools,
        }}
      />
    </div>
  );
}
