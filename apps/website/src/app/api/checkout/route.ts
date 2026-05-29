import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { appUrl, stripe, stripeConfig } from "@/lib/stripe";
import { getPromptById } from "@/lib/prompts/queries";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("subscription"),
    tier: z.enum(["yearly", "lifetime"]),
  }),
  z.object({
    mode: z.literal("one_time"),
    promptId: z.string().uuid(),
  }),
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let customerId = (
    await db
      .select({ id: schema.profiles.stripeCustomerId })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, session.user.id))
      .limit(1)
  )[0]?.id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db
      .update(schema.profiles)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(schema.profiles.userId, session.user.id));
  }

  try {
    if (parsed.data.mode === "subscription") {
      const priceId =
        parsed.data.tier === "yearly"
          ? stripeConfig.yearlyPriceId
          : stripeConfig.lifetimePriceId;
      if (!priceId) {
        return NextResponse.json(
          { error: "Stripe price not configured" },
          { status: 500 },
        );
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: parsed.data.tier === "lifetime" ? "payment" : "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: appUrl("/account?checkout=success"),
        cancel_url: appUrl("/pricing?checkout=cancel"),
        metadata: { userId: session.user.id, tier: parsed.data.tier },
      });
      return NextResponse.json({ url: checkout.url });
    }

    const prompt = await getPromptById(parsed.data.promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }
    if (prompt.isFree) {
      return NextResponse.json({ error: "Already free" }, { status: 400 });
    }
    if (prompt.priceCents <= 0) {
      return NextResponse.json(
        { error: "Subscription-only prompt" },
        { status: 400 },
      );
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: prompt.priceCents,
            product_data: {
              name: prompt.title,
              metadata: { promptId: prompt.id },
            },
          },
        },
      ],
      success_url: appUrl(`/prompt/${prompt.id}?checkout=success`),
      cancel_url: appUrl(`/prompt/${prompt.id}?checkout=cancel`),
      metadata: {
        userId: session.user.id,
        promptId: prompt.id,
        mode: "one_time",
      },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("checkout failed", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
