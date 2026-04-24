import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskScoreCardProps {
  score: number;
  explanation: string;
}

function getRiskColor(score: number) {
  if (score <= 3) return { bar: "bg-green-500", text: "text-green-600 dark:text-green-400", label: "Low Risk" };
  if (score <= 5) return { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "Moderate" };
  if (score <= 7) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Elevated" };
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "High Risk" };
}

export function RiskScoreCard({ score, explanation }: RiskScoreCardProps) {
  const { text, label } = getRiskColor(score);
  const pct = (score / 10) * 100;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</span>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        <div className="flex items-baseline gap-3">
          <span className={cn("text-5xl font-black tabular-nums", text)}>{score.toFixed(1)}</span>
          <span className="text-2xl text-muted-foreground font-light">/ 10</span>
          <span className={cn("text-sm font-semibold ml-auto", text)}>{label}</span>
        </div>

        {/* Gradient progress bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", pct > 70 ? "bg-gradient-to-r from-amber-400 to-red-500" : pct > 40 ? "bg-gradient-to-r from-blue-400 to-amber-400" : "bg-gradient-to-r from-green-400 to-blue-400")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Safe</span>
            <span>Risky</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed border-t pt-4">
          {explanation}
        </p>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Lower is safer. Higher means more caution and verification needed.
        </p>
      </CardContent>
    </Card>
  );
}
