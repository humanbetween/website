import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in?redirect=/account");
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-20 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Account</h1>
        <SignOutButton />
      </header>

      <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Profile
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{session.user.name || "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{session.user.email}</dd>
        </dl>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Subscription
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Stripe customer portal lands in Phase 5.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          See pricing
        </Link>
      </section>
    </div>
  );
}
