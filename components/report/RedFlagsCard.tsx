import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import type { RedFlag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RedFlagsCardProps {
  redFlags: RedFlag[];
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15",
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    label: "High",
  },
  medium: {
    icon: AlertCircle,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    label: "Medium",
  },
  low: {
    icon: Info,
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
    border: "border-l-blue-400",
    bg: "bg-blue-500/5",
    label: "Low",
  },
};

export function RedFlagsCard({ redFlags }: RedFlagsCardProps) {
  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Red Flags</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {redFlags.length} found
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {redFlags.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              No major red flags detected based on the provided listing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {redFlags
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.severity] - order[b.severity];
              })
              .map((flag) => {
                const config = severityConfig[flag.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={flag.id}
                    className={cn(
                      "rounded-xl border border-l-4 p-4",
                      config.border,
                      config.bg
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", flag.severity === "high" ? "text-red-500" : flag.severity === "medium" ? "text-amber-500" : "text-blue-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{flag.title}</p>
                          <Badge className={cn("text-xs rounded-full", config.badge)}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{flag.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
