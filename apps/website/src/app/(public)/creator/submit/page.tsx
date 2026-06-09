import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCreator } from "@/lib/creator";
import { PromptForm } from "@/components/admin/PromptForm";

export const dynamic = "force-dynamic";

export default async function CreatorSubmitPage() {
  await requireCreator();

  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/creator"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-medium">Submit a project</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Upload your prompt or website. Our team reviews it before it goes live
          in the library — you&apos;ll get an email either way.
        </p>
      </header>
      <PromptForm mode="create" audience="creator" />
    </div>
  );
}
