"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipboardList, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyerChecklistCardProps {
  checklist: string[];
}

export function BuyerChecklistCard({ checklist }: BuyerChecklistCardProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const pct = checklist.length > 0 ? Math.round((checked.size / checklist.length) * 100) : 0;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Buyer Checklist
            </span>
          </div>
          <span className="text-xs font-semibold text-primary">
            {checked.size}/{checklist.length} done
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                checked.has(i)
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-transparent hover:border-border"
              )}
            >
              {checked.has(i) ? (
                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn("text-sm", checked.has(i) ? "text-foreground line-through text-muted-foreground" : "text-foreground")}>
                {item}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Check off each step as you complete it before finalizing the deal.
        </p>
      </CardContent>
    </Card>
  );
}
