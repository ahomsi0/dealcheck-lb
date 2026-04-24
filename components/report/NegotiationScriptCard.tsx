"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check } from "lucide-react";

interface NegotiationScriptCardProps {
  script: string;
}

export function NegotiationScriptCard({ script }: NegotiationScriptCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Negotiation Script
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        <p className="text-xs text-muted-foreground">
          Send this message to the seller. It&apos;s polite, practical, and signals you&apos;re a serious buyer.
        </p>
        <div className="rounded-xl bg-muted/50 border p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
          {script}
        </div>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full rounded-full gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied to clipboard
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy message
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Edit before sending — adjust price and tone to your situation.
        </p>
      </CardContent>
    </Card>
  );
}
