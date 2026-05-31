import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(secret, {
  typescript: true,
});

export const stripeConfig = {
  monthlyPriceId: process.env.STRIPE_PRICE_MONTHLY ?? "",
  yearlyPriceId: process.env.STRIPE_PRICE_YEARLY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

export function appUrl(path: string) {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelDeploy = process.env.VERCEL_URL;
  const base = explicit
    ? explicit
    : vercelProd
      ? `https://${vercelProd}`
      : vercelDeploy
        ? `https://${vercelDeploy}`
        : "http://localhost:3000";
  return new URL(path, base).toString();
}
