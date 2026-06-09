import { NextResponse } from "next/server";
import { resolveAffiliateByCode } from "@/lib/affiliate";
import { getAffiliateSettings } from "@/lib/site-settings";
import { appUrl } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const REF_COOKIE = "hb_ref";

// A creator's share link: /r/<code> drops a first-party referral cookie then
// bounces to the home page. Checkout reads the cookie server-side later.
export async function GET(
  request: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const limited = await rateLimit(request, "ref", 60, 60_000);
  if (limited) return limited;

  const { code } = await ctx.params;

  // Optional ?p=<slug> deep-links straight to a product (still sets the cookie),
  // so a creator can share a link to their own project that also credits them.
  const slug = new URL(request.url).searchParams.get("p");
  const safeSlug =
    slug && /^[a-z0-9-]{1,80}$/.test(slug) ? slug : null;
  const dest = safeSlug ? `/?prompt=${safeSlug}` : "/";
  const res = NextResponse.redirect(appUrl(dest));

  const affiliate = await resolveAffiliateByCode(code).catch(() => null);
  if (affiliate && affiliate.status === "active") {
    const { cookieDays } = await getAffiliateSettings();
    res.cookies.set(REF_COOKIE, affiliate.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieDays * 24 * 60 * 60,
      path: "/",
    });
  }
  return res;
}
