import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { generateAffiliateCode, resolveAffiliate } from "@/lib/affiliate";
import { getAffiliateSettings } from "@/lib/site-settings";
import { appUrl } from "@/lib/stripe";
import { sendCreatorWelcomeEmail } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "creator-join", 5, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const userId = session.user.id;

  const existing = await resolveAffiliate(userId);
  if (existing) {
    return NextResponse.json({ code: existing.code, link: appUrl(`/r/${existing.code}`) });
  }

  const { rateBps } = await getAffiliateSettings();

  // Insert with collision-retry: the code's unique index rejects dupes.
  let code = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    code = generateAffiliateCode(session.user.name ?? null);
    try {
      await db.insert(schema.affiliateAccounts).values({
        userId,
        code,
        commissionRateBps: rateBps,
      });
      break;
    } catch (err) {
      // Unique violation on the code → regenerate and retry. A second insert for
      // the same user (PK clash) means a concurrent join already succeeded.
      const dup = await resolveAffiliate(userId);
      if (dup) {
        return NextResponse.json({ code: dup.code, link: appUrl(`/r/${dup.code}`) });
      }
      if (attempt === 3) {
        console.error("creator join failed", err);
        return NextResponse.json({ error: "Could not create code" }, { status: 500 });
      }
    }
  }

  const link = appUrl(`/r/${code}`);
  if (session.user.email) {
    await sendCreatorWelcomeEmail({ to: session.user.email, code, link }).catch(
      (err) => console.error("creator welcome email failed", err),
    );
  }

  return NextResponse.json({ code, link });
}
