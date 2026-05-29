"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [mode, setMode] = useState<"password" | "magic">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "magic") {
        const res = await authClient.signIn.magicLink({
          email,
          callbackURL: redirectTo,
        });
        if (res.error) throw new Error(res.error.message ?? "Failed to send link");
        setSent(true);
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirectTo,
        });
        if (res.error) throw new Error(res.error.message ?? "Sign-in failed");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="text-foreground">{email}</span>.
          The link expires in 5 minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          Use a different email
        </button>
      </>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Email</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
              placeholder="you@example.com"
            />
          </div>
        </label>

        {mode === "password" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
                placeholder="••••••••"
              />
            </div>
          </label>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "..." : mode === "magic" ? "Send magic link" : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "magic" ? "password" : "magic")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "magic" ? "Use password instead" : "Use a magic link instead"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-2">
        New here?{" "}
        <Link href="/auth/sign-up" className="text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
