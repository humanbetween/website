import { PromptForm } from "@/components/admin/PromptForm";
import { AdminPageHeader } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function NewPromptPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="Content"
        title="New prompt"
        subtitle="Uploads land in Cloudflare R2. Only this form writes to the prompts table."
      />
      <PromptForm mode="create" />
    </div>
  );
}
