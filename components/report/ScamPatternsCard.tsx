import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import type { ScamPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ScamPatternsCardProps {
  patterns: ScamPattern[];
}

const severityCn = {
  high: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
  low: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
};

export function ScamPatternsCard({ patterns }: ScamPatternsCardProps) {
  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Scam Patterns
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {patterns.length} detected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {patterns.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              No common scam patterns detected in the provided text.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{pattern.title}</p>
                  <Badge className={cn("rounded-full text-xs", severityCn[pattern.severity])}>
                    {pattern.severity}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{pattern.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
