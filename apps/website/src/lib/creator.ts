import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAffiliate, type AffiliateAccount } from "@/lib/affiliate";

/**
 * Gate a creator-only page. No session → sign-in; signed in but not yet a
 * creator → the opt-in page; otherwise return the session + affiliate account.
 */
export const requireCreator = cache(async (): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  account: AffiliateAccount;
}> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in?redirect=/creator");
  }
  const account = await resolveAffiliate(session.user.id);
  if (!account) {
    redirect("/creator/join");
  }
  return { session, account };
});
