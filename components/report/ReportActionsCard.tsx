"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileDown } from "lucide-react";
import type { DealAnalysis, ListingInput } from "@/lib/types";

interface ReportActionsCardProps {
  result: DealAnalysis;
  input: ListingInput;
}

export function ReportActionsCard({ result, input }: ReportActionsCardProps) {
  const [copied, setCopied] = useState(false);

  function buildSummary() {
    return [
      `DealCheck report: ${input.title || "Listing"}`,
      `Verdict: ${result.verdictLabel}`,
      `Risk: ${result.riskScore.toFixed(1)} / 10`,
      `Seller: ${result.sellerTrust.label}`,
      `Suggested offer: ${result.priceCheck.currency === "USD" ? "$" : ""}${result.priceCheck.suggestedOffer.toLocaleString()}${result.priceCheck.currency === "LBP" ? " LBP" : ""}`,
      `Red flags: ${result.redFlags.length}`,
      `Scam patterns: ${result.scamPatterns.length}`,
    ].join("\n");
  }

  async function copyReportLink() {
    const summary = buildSummary();
    const encoded = btoa(unescape(encodeURIComponent(summary)));
    const url = `${window.location.origin}${window.location.pathname}#report=${encodeURIComponent(encoded)}`;
    const shareText = `${url}\n\n${summary}`;

    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="rounded-2xl border print:hidden">
      <CardContent className="flex flex-col gap-3 px-6 py-5 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1 rounded-full gap-2" onClick={copyReportLink}>
          <Copy className="h-4 w-4" />
          {copied ? "Copied report link" : "Copy report link"}
        </Button>
        <Button type="button" variant="outline" className="flex-1 rounded-full gap-2" onClick={() => window.print()}>
          <FileDown className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </CardContent>
    </Card>
  );
}
