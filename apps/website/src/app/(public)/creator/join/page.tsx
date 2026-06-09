import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAffiliate } from "@/lib/affiliate";
import { getAffiliateSettings } from "@/lib/site-settings";
import { JoinCreator } from "./JoinCreator";

export const dynamic = "force-dynamic";

export default async function CreatorJoinPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in?redirect=/creator/join");

  const existing = await resolveAffiliate(session.user.id);
  if (existing) redirect("/creator");

  const { rateBps, capWindowDays } = await getAffiliateSettings();
  const pct = rateBps / 100;

  return (
    <div className="container mx-auto max-w-2xl px-6 py-20 flex flex-col gap-6">
      <header>
        <p className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-[11px] font-mono uppercase tracking-wider text-muted-foreground border border-border/40 bg-card/40">
          Creator program
        </p>
        <h1 className="text-3xl md:text-4xl font-medium">
          Earn {pct}% on everyone you bring in.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Get a personal link. When someone subscribes or buys through it, you
          earn {pct}% — on subscriptions for the first {capWindowDays} days per
          customer, and on every one-time purchase. Track referrals and earnings
          in your dashboard, withdraw to your bank soon.
        </p>
      </header>

      <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
        <ol className="grid gap-4 text-sm">
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">1.</span>
            Join the program — you get a unique referral link instantly.
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">2.</span>
            Share it anywhere. Visitors who arrive through it are linked to you.
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">3.</span>
            Earn {pct}% on their purchases — tracked automatically in your
            dashboard.
          </li>
        </ol>
      </section>

      <div>
        <JoinCreator />
      </div>
    </div>
  );
}
