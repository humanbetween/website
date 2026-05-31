"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Loader2, Check, Send } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactBubble() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setName("");
    setEmail("");
    setMessage("");
    setStatus("idle");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Send failed");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Contact us"
          className="w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl flex flex-col overflow-hidden"
        >
          <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ask us anything</p>
              <p className="text-[11px] text-muted-foreground">
                We typically reply within a few hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {status === "sent" ? (
            <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-foreground/5 inline-flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Message sent.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We&apos;ll reply to {email} shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
              <input
                ref={firstFieldRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder="Your name"
                className={inputCls}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
                placeholder="Email address"
                className={inputCls}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={4000}
                rows={4}
                placeholder="What's on your mind?"
                className={`${inputCls} resize-none`}
              />
              {error && (
                <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
              >
                {status === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close contact form" : "Open contact form"}
        className="h-12 w-12 rounded-full bg-foreground text-background shadow-lg inline-flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/60";
