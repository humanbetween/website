"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, Mail, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  ctaLabel: string;
};

type Status = "idle" | "sending" | "sent" | "error";

export function NewsletterCtaButton({ ctaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => emailRef.current?.focus(), 60);
  }, [open]);

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setEmail("");
      setName("");
      setConsent(true);
      setStatus("idle");
      setError(null);
    }, 200);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!consent) {
      setError("Tick the box to confirm you want our emails.");
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source: "footer",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not subscribe");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not subscribe");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 text-sm font-semibold hover:opacity-90 shadow-lg shadow-sky-500/20 transition-opacity"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border/60 [&>button]:hidden">
          <div className="relative p-6 sm:p-8">
            <button
              type="button"
              onClick={resetAndClose}
              aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            >
              <X className="h-4 w-4" />
            </button>

            {status === "sent" ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 inline-flex items-center justify-center text-slate-900">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-medium">
                    You&apos;re in.
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                    We&apos;ll send the next prompt drop straight to{" "}
                    <span className="text-foreground">{email}</span>.
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-5">
                  <div className="h-10 w-10 rounded-full bg-foreground/5 inline-flex items-center justify-center text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <DialogTitle className="text-xl font-medium tracking-tight">
                    Get every new prompt as it lands.
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    One email when we ship a new prompt or tip. No spam, no
                    threads. Unsubscribe in one click.
                  </DialogDescription>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-3">
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    placeholder="First name (optional)"
                    className={inputCls}
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={200}
                    placeholder="you@email.com"
                    className={inputCls}
                  />
                  <label className="inline-flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-border/60 accent-foreground"
                    />
                    <span>
                      I agree to receive occasional emails from Human Prompts.
                      Unsubscribe any time.
                    </span>
                  </label>
                  {error && (
                    <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 text-sm font-semibold hover:opacity-90 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-opacity"
                  >
                    {status === "sending" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {status === "sending" ? "Subscribing…" : ctaLabel}
                  </button>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/40";
