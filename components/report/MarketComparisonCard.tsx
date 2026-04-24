import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import type { Currency, MarketComparison } from "@/lib/types";

interface MarketComparisonCardProps {
  comparison?: MarketComparison;
  currency: Currency;
}

function fmt(value: number, currency: Currency) {
  return currency === "USD" ? `$${value.toLocaleString()}` : `${value.toLocaleString()} LBP`;
}

export function MarketComparisonCard({ comparison, currency }: MarketComparisonCardProps) {
  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Comparable Listings
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {comparison ? `${comparison.sampleSize} comps` : "Optional"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {!comparison ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste at least 3 similar listing prices before analysis to unlock median-based comparison.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Median</p>
                <p className="text-sm font-bold">{fmt(comparison.medianPrice, currency)}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Lowest</p>
                <p className="text-sm font-bold">{fmt(comparison.lowPrice, currency)}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Highest</p>
                <p className="text-sm font-bold">{fmt(comparison.highPrice, currency)}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">
              {comparison.label}: {comparison.deltaPercent > 0 ? "+" : ""}
              {comparison.deltaPercent}% vs median
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{comparison.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
