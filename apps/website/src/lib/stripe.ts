import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder";

export const stripe = new Stripe(secret, {
  typescript: true,
});

export const stripeConfig = {
  monthlyPriceId: process.env.STRIPE_PRICE_MONTHLY ?? "",
  lifetimePriceId: process.env.STRIPE_PRICE_LIFETIME ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
