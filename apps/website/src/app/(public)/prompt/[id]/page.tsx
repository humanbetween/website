import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { canAccessPrompt } from "@/lib/access";
import {
  getPromptById,
  getSimilarPrompts,
  incrementPopularity,
} from "@/lib/prompts/queries";
import { CATEGORY_LABELS, type Category } from "@/lib/prompts/types";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import { CopyPromptButton } from "./CopyPromptButton";
import { UnlockButton } from "./UnlockButton";

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
  const allowed = await canAccessPrompt({
    isFree: prompt.isFree,
    promptId: prompt.id,
    userId: session?.user.id ?? null,
  }).catch(() => false);

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

        {prompt.promptText && (
        <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Prompt
            </h2>
            {allowed ? (
              <CopyPromptButton text={prompt.promptText ?? ""} />
            ) : !session ? (
              <Link
                href={`/auth/sign-in?redirect=/prompt/${prompt.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
              >
                <Lock className="h-3 w-3" /> Sign in to unlock
              </Link>
            ) : (
              <UnlockButton />
            )}
          </div>
          {allowed ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-mono">
              {prompt.promptText}
            </pre>
          ) : (
            <div className="h-32 rounded-lg bg-background/40 border border-dashed border-border/60 flex items-center justify-center px-4 text-center">
              <p className="text-xs text-muted-foreground">
                {!session
                  ? "Sign in to view the prompt."
                  : "Go unlimited to view this prompt."}
              </p>
            </div>
          )}
        </section>
        )}

        {prompt.websiteUrl && (
          <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Website
              </h2>
              {allowed ? (
                <a
                  href={prompt.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
                >
                  <ExternalLink className="h-3 w-3" /> Visit website
                </a>
              ) : !session ? (
                <Link
                  href={`/auth/sign-in?redirect=/prompt/${prompt.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
                >
                  <Lock className="h-3 w-3" /> Sign in to unlock
                </Link>
              ) : (
                <UnlockButton />
              )}
            </div>
          </section>
        )}

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/prompt/${s.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-card/60 border border-border/40 hover:border-border hover:bg-card/90 transition-colors"
                >
                  <AutoPlayMedia
                    src={s.videoUrl}
                    poster={s.thumbnailUrl}
                    alt={s.title}
                    aspectRatio="4 / 3"
                  />
                  <div className="px-3 py-3">
                    <h3 className="text-sm font-medium truncate leading-tight">
                      {s.title}
                    </h3>
                    {s.categories[0] && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {CATEGORY_LABELS[s.categories[0] as Category] ?? s.categories[0]}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

