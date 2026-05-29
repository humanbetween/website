import { requireAdmin } from "@/lib/admin";
import { PromptForm } from "@/components/admin/PromptForm";

export const dynamic = "force-dynamic";

export default async function NewPromptPage() {
  await requireAdmin();
  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-medium mb-2">New prompt</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Uploads land in Cloudflare R2; only this form writes to the prompts
        table.
      </p>
      <PromptForm mode="create" />
    </div>
  );
}
