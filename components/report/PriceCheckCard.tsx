import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import type { PriceCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PriceCheckCardProps {
  priceCheck: PriceCheck;
}

function fmt(n: number, currency: string) {
  if (currency === "LBP") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M LBP`;
    return `${n.toLocaleString()} LBP`;
  }
  return `$${n.toLocaleString()}`;
}

const verdictStyle: Record<string, { badge: string; icon: React.ElementType }> = {
  fair: {
    badge: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15",
    icon: Minus,
  },
  "slightly-overpriced": {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
    icon: TrendingUp,
  },
  "very-overpriced": {
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15",
    icon: TrendingUp,
  },
  "suspiciously-cheap": {
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25 hover:bg-orange-500/15",
    icon: TrendingDown,
  },
  unknown: {
    badge: "bg-muted text-muted-foreground border-border hover:bg-muted",
    icon: Minus,
  },
};

export function PriceCheckCard({ priceCheck }: PriceCheckCardProps) {
  const style = verdictStyle[priceCheck.verdict] ?? verdictStyle.unknown;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Negotiation Guide
            </span>
          </div>
          <Badge className={cn("rounded-full text-xs font-semibold", style.badge)}>
            {priceCheck.verdictLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">
        {/* Basis note */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {priceCheck.basisNote}
        </p>

        {/* Price rows */}
        <div className="space-y-2.5">
          {/* Asking price */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-transparent px-4 py-3">
            <span className="text-sm text-muted-foreground">Seller asking</span>
            <span className="font-bold text-sm tabular-nums text-foreground">
              {fmt(priceCheck.listedPrice, priceCheck.currency)}
            </span>
          </div>

          {/* Suggested offer */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <div>
              <span className="text-sm text-foreground font-medium">Suggested opening offer</span>
              <p className="text-xs text-muted-foreground mt-0.5">Start your negotiation here</p>
            </div>
            <span className="font-bold text-sm tabular-nums text-primary">
              {fmt(priceCheck.suggestedOffer, priceCheck.currency)}
            </span>
          </div>

          {/* Max recommended */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-transparent px-4 py-3">
            <div>
              <span className="text-sm text-muted-foreground">Walk-away price</span>
              <p className="text-xs text-muted-foreground mt-0.5">Don&apos;t pay more than this</p>
            </div>
            <span className="font-bold text-sm tabular-nums text-foreground">
              {fmt(priceCheck.maxRecommended, priceCheck.currency)}
            </span>
          </div>
        </div>

        {/* Potential saving callout */}
        <div className="flex items-center gap-2.5 rounded-xl bg-green-500/8 border border-green-500/20 px-4 py-3">
          <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            Potential saving if negotiation succeeds:{" "}
            <span className="font-bold">
              {fmt(priceCheck.potentialSaving, priceCheck.currency)}
            </span>
          </p>
        </div>

        {/* Honest disclaimer */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            These are negotiation targets based on risk factors in the listing — not a market price
            lookup. Check{" "}
            <span className="font-medium text-foreground">OLX Lebanon</span> and{" "}
            <span className="font-medium text-foreground">Facebook Marketplace</span> for current
            comparable listings to calibrate the real market price.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
