import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPromptById, getSimilarPrompts } from "@/lib/prompts/queries";
import { CATEGORY_LABELS, type Category, type PromptListItem } from "@/lib/prompts/types";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CopyPromptButton } from "./CopyPromptButton";

export default async function PromptDetailPage({
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

  const session = await auth.api.getSession({ headers: await headers() });
  const canSee = prompt.isFree || Boolean(session?.user);

  const similar = await getSimilarPrompts(prompt.id, prompt.categories).catch(() => []);

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to library
      </Link>

      <div className="grid gap-8">
        <AutoPlayMedia
          src={prompt.videoUrl}
          poster={prompt.thumbnailUrl}
          alt={prompt.title}
          aspectRatio="16 / 10"
          className="rounded-2xl border border-border/40"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {prompt.categories.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 text-[11px] rounded-full bg-card/60 border border-border/60 text-muted-foreground"
              >
                {CATEGORY_LABELS[c as Category]}
              </span>
            ))}
            {prompt.isFree && (
              <span className="px-2.5 py-1 text-[11px] rounded-full bg-foreground text-background font-medium">
                Free
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-medium">{prompt.title}</h1>
          {prompt.description && (
            <p className="text-muted-foreground max-w-2xl">{prompt.description}</p>
          )}
        </header>

        <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Prompt
            </h2>
            {canSee ? (
              <CopyPromptButton text={prompt.promptText} />
            ) : (
              <Link
                href={`/auth/sign-in?redirect=/prompt/${prompt.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
              >
                <Lock className="h-3 w-3" /> Sign in to view
              </Link>
            )}
          </div>
          {canSee ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-mono">
              {prompt.promptText}
            </pre>
          ) : (
            <div className="h-32 rounded-lg bg-background/40 border border-dashed border-border/60 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Sign in to view the prompt. Subscription gating arrives in Phase 5.
              </p>
            </div>
          )}
        </section>

        {(prompt.tools.length > 0 || prompt.tags.length > 0) && (
          <section className="grid sm:grid-cols-2 gap-4">
            {prompt.tools.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Use with
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tools.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[11px] rounded-full bg-secondary border border-border/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {prompt.tags.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Best for
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[11px] rounded-full bg-secondary border border-border/40 text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Similar prompts
            </h2>
            <div className="columns-2 md:columns-4 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {similar.map((s) => (
                <PromptCard
                  key={s.id}
                  prompt={toListItem(s)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function toListItem(p: {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  priceCents: number;
  categories: string[];
  tags: string[];
  tools: string[];
  popularityCount: number;
  createdAt: Date;
}): PromptListItem {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    videoUrl: p.videoUrl,
    thumbnailUrl: p.thumbnailUrl,
    isFree: p.isFree,
    priceCents: p.priceCents,
    categories: p.categories as Category[],
    tags: p.tags,
    tools: p.tools,
    popularityCount: p.popularityCount,
    createdAt: p.createdAt.toISOString(),
  };
}
