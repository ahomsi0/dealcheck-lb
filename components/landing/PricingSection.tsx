import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";

const availableNowFeatures = [
  "Unlimited listing analyses",
  "Risk score with full explanation",
  "Negotiation guide (suggested offer + walk-away price)",
  "Category-specific red flags",
  "Seller questions tailored to item type",
  "Ready-to-send negotiation script",
];

const comingSoonFeatures = [
  "Market range based on real comparables",
  "Automated median price benchmarking",
  "Advanced paid plans",
];

export function PricingSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            DealCheck is currently free during early access. Some advanced features are still in development.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          <Card className="rounded-2xl border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl">Free</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$0</span>
                <span className="text-muted-foreground text-sm">/ forever</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">Everything currently available in DealCheck.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available now</p>
              {availableNowFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 text-sm">
                <span className="text-xs text-muted-foreground">No payment required right now.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-primary/40 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl">Pro</h3>
                <Badge className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Coming soon
                </Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$5</span>
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                Planned advanced capabilities after launch.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Planned features
              </p>
              {comingSoonFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
