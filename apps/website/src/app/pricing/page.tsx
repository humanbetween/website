import { Check } from "lucide-react";
import { PricingButtons } from "./PricingButtons";

const FEATURES = [
  "Full access to the prompt library",
  "Every new prompt as it lands",
  "Copy in one click, no per-prompt unlocks",
  "Commercial use included",
];

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-20">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-medium">Pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Two ways in. Cancel anytime, or pay once and own it forever.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <Plan
          tier="monthly"
          name="Monthly"
          price="$19"
          unit="/mo"
          tagline="Best for trying everything before committing."
        />
        <Plan
          tier="lifetime"
          name="Lifetime"
          price="$199"
          unit="once"
          tagline="One payment, every current and future prompt, forever."
          highlight
        />
      </div>
    </div>
  );
}

function Plan({
  tier,
  name,
  price,
  unit,
  tagline,
  highlight = false,
}: {
  tier: "monthly" | "lifetime";
  name: string;
  price: string;
  unit: string;
  tagline: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl p-8 border bg-card/40 flex flex-col gap-5 " +
        (highlight ? "border-foreground/60" : "border-border/40")
      }
    >
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {name}
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-5xl font-medium">{price}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{tagline}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <PricingButtons tier={tier} highlight={highlight} />
    </div>
  );
}
