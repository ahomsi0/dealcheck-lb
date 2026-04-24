import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfidenceCardProps {
  confidence: ConfidenceLevel;
  reason: string;
}

const config: Record<ConfidenceLevel, { label: string; badge: string; bar: string; pct: number }> = {
  low: {
    label: "Low Confidence",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15",
    bar: "bg-red-500",
    pct: 30,
  },
  medium: {
    label: "Medium Confidence",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
    bar: "bg-amber-500",
    pct: 65,
  },
  high: {
    label: "High Confidence",
    badge: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15",
    bar: "bg-green-500",
    pct: 92,
  },
};

export function ConfidenceCard({ confidence, reason }: ConfidenceCardProps) {
  const c = config[confidence];
  return (
    <Card className="rounded-2xl border">
      <CardContent className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Analysis Confidence</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", c.bar)} style={{ width: `${c.pct}%` }} />
            </div>
            <Badge className={cn("shrink-0 rounded-full font-semibold", c.badge)}>
              {c.label}
            </Badge>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{reason}</p>
      </CardContent>
    </Card>
  );
}
