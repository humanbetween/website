"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });
      if (res.error) throw new Error(res.error.message ?? "Sign-up failed");
      if (newsletter) {
        fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "signup" }),
          keepalive: true,
        }).catch(() => {});
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-6 py-20">
      <div className="rounded-2xl border border-border/40 bg-card/40 p-8 flex flex-col gap-5">
        <h1 className="text-2xl font-medium">Create your account</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Name</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
                placeholder="Your name"
              />
            </div>
          </label>

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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
                placeholder="At least 8 characters"
              />
            </div>
          </label>

          <label className="inline-flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-border/60 accent-foreground"
            />
            <span>
              Send me occasional emails about new prompts and tips. Unsubscribe
              anytime.
            </span>
          </label>

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
            {pending ? "..." : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
