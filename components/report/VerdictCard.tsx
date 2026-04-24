import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingDown, TrendingUp, CheckCircle } from "lucide-react";
import type { RiskVerdict } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VerdictCardProps {
  verdict: RiskVerdict;
  verdictLabel: string;
  verdictExplanation: string;
}

const verdictConfig: Record<
  RiskVerdict,
  { bg: string; border: string; text: string; icon: React.ElementType; badgeCn: string }
> = {
  "good-deal": {
    bg: "bg-green-500/10",
    border: "border-green-500/25",
    text: "text-green-700 dark:text-green-400",
    icon: CheckCircle,
    badgeCn: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15",
  },
  fair: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-700 dark:text-blue-400",
    icon: Shield,
    badgeCn: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
  },
  overpriced: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-700 dark:text-amber-400",
    icon: TrendingUp,
    badgeCn: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
  },
  "high-risk": {
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    text: "text-red-700 dark:text-red-400",
    icon: AlertTriangle,
    badgeCn: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15",
  },
  "suspiciously-cheap": {
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    text: "text-orange-700 dark:text-orange-400",
    icon: TrendingDown,
    badgeCn: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25 hover:bg-orange-500/15",
  },
};

export function VerdictCard({ verdict, verdictLabel, verdictExplanation }: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <Card className={cn("rounded-2xl border", config.border, config.bg)}>
      <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", config.bg, "border", config.border)}>
          <Icon className={cn("h-7 w-7", config.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overall verdict</p>
            <Badge className={cn("rounded-full font-semibold", config.badgeCn)}>
              {verdictLabel}
            </Badge>
          </div>
          <p className={cn("font-bold text-2xl", config.text)}>{verdictLabel}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{verdictExplanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
