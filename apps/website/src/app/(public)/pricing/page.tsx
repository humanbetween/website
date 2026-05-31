import { Suspense } from "react";
import { Check, X } from "lucide-react";
import { getPricingBanner, getPricingPlans } from "@/lib/site-settings";
import { PricingBanner } from "@/components/site/PricingBanner";
import { CheckoutCancelToast } from "./CheckoutCancelToast";
import { PricingButtons } from "./PricingButtons";

export const dynamic = "force-dynamic";

const YEARLY_FEATURES: Array<{ label: string; included: boolean }> = [
  { label: "Unlimited access to the prompt library", included: true },
  { label: "Every new prompt as it lands", included: true },
  { label: "Animated backgrounds collection", included: true },
  { label: "Commercial license", included: true },
  { label: "Cancel anytime", included: true },
  { label: "Priority email support", included: false },
  { label: "Pay once, own it forever", included: false },
];

const LIFETIME_FEATURES: Array<{ label: string; included: boolean }> = [
  { label: "Unlimited access to the prompt library", included: true },
  { label: "Every new prompt as it lands — forever", included: true },
  { label: "Animated backgrounds collection", included: true },
  { label: "Commercial license", included: true },
  { label: "Priority email support", included: true },
  { label: "Pay once, own it forever", included: true },
];

export default async function PricingPage() {
  const [banner, plans] = await Promise.all([
    getPricingBanner(),
    getPricingPlans(),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutCancelToast />
      </Suspense>
      <PricingBanner banner={banner} />

      <div className="container mx-auto max-w-5xl px-6 pt-16 pb-24">
        <header className="text-center mb-10">
          <p className="inline-flex items-center px-3 py-1 mb-4 rounded-full text-[11px] font-mono uppercase tracking-wider text-muted-foreground border border-border/40 bg-card/40">
            Pricing
          </p>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight">
            Choose your plan.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Pick the plan that fits your workflow. Subscribe yearly or save big
            with a lifetime deal.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <Plan
            tier="yearly"
            name="Yearly"
            description={plans.yearlyDescription}
            priceCents={plans.yearlyCents}
            originalCents={plans.yearlyOriginalCents}
            unit="/ year"
            tagline="Cancel anytime."
            features={YEARLY_FEATURES}
            cta="Subscribe yearly"
          />
          <Plan
            tier="lifetime"
            name="Lifetime"
            description={plans.lifetimeDescription}
            badge="Best value"
            priceCents={plans.lifetimeCents}
            originalCents={plans.lifetimeOriginalCents}
            unit="once"
            tagline="Pay once. Own every prompt, forever."
            features={LIFETIME_FEATURES}
            cta="Buy lifetime"
            highlight
          />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Stripe handles every transaction. No card details ever touch our
          servers.
        </p>
      </div>
    </>
  );
}

function Plan({
  tier,
  name,
  description,
  badge,
  priceCents,
  originalCents,
  unit,
  tagline,
  features,
  cta,
  highlight = false,
}: {
  tier: "yearly" | "lifetime";
  name: string;
  description: string;
  badge?: string;
  priceCents: number;
  originalCents: number | null;
  unit: string;
  tagline: string;
  features: Array<{ label: string; included: boolean }>;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={
        "rounded-2xl p-7 border bg-card/40 flex flex-col gap-5 " +
        (highlight ? "border-foreground/60" : "border-border/40")
      }
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {name}
          </p>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-foreground text-background">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            {description}
          </p>
        )}
        <div className="border-t border-dashed border-border/60 mt-1" />
      </header>

      <div className="flex items-baseline gap-2 flex-wrap font-system-num">
        {originalCents !== null && (
          <span className="text-2xl sm:text-3xl font-bold text-muted-foreground line-through tabular-nums tracking-tight">
            ${(originalCents / 100).toFixed(0)}
          </span>
        )}
        <span className="text-5xl font-bold tracking-tight tabular-nums">
          ${(priceCents / 100).toFixed(0)}
        </span>
        <span className="text-sm font-medium text-muted-foreground font-sans">
          {unit}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{tagline}</p>

      <ul className="flex flex-col gap-2 text-sm">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-2">
            {f.included ? (
              <Check className="h-4 w-4 mt-0.5 text-foreground shrink-0" />
            ) : (
              <X className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={
                f.included ? "" : "text-muted-foreground/40 line-through"
              }
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <PricingButtons tier={tier} cta={cta} highlight={highlight} />
    </article>
  );
}
