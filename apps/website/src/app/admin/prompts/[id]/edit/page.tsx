import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getPromptById } from "@/lib/prompts/queries";
import { PromptForm } from "@/components/admin/PromptForm";
import type { Category } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
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
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-medium mb-2">Edit prompt</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Changes go live as soon as you save.
      </p>
      <PromptForm
        mode="edit"
        initial={{
          id: prompt.id,
          title: prompt.title,
          description: prompt.description,
          promptText: prompt.promptText,
          priceCents: prompt.priceCents,
          isFree: prompt.isFree,
          videoUrl: prompt.videoUrl,
          thumbnailUrl: prompt.thumbnailUrl,
          assets: prompt.assets,
          categories: prompt.categories as Category[],
          tags: prompt.tags,
          tools: prompt.tools,
        }}
      />
    </div>
  );
}
