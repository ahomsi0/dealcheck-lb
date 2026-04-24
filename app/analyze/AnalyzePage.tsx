"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyzerForm } from "@/components/analyzer/AnalyzerForm";
import { VerdictCard } from "@/components/report/VerdictCard";
import { RiskScoreCard } from "@/components/report/RiskScoreCard";
import { PriceCheckCard } from "@/components/report/PriceCheckCard";
import { RedFlagsCard } from "@/components/report/RedFlagsCard";
import { SellerQuestionsCard } from "@/components/report/SellerQuestionsCard";
import { NegotiationScriptCard } from "@/components/report/NegotiationScriptCard";
import { BuyerChecklistCard } from "@/components/report/BuyerChecklistCard";
import { ConfidenceCard } from "@/components/report/ConfidenceCard";
import { MarketComparisonCard } from "@/components/report/MarketComparisonCard";
import { ReportActionsCard } from "@/components/report/ReportActionsCard";
import { ScamPatternsCard } from "@/components/report/ScamPatternsCard";
import { SellerTrustCard } from "@/components/report/SellerTrustCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Info, ChevronDown } from "lucide-react";
import type { DealAnalysis, ListingInput, Category } from "@/lib/types";

export function AnalyzePage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const categoryParam = searchParams.get("category") as Category | null;

  const [result, setResult] = useState<DealAnalysis | null>(null);
  const [submittedInput, setSubmittedInput] = useState<ListingInput | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function handleResult(analysis: DealAnalysis, input: ListingInput) {
    setResult(analysis);
    setSubmittedInput(input);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleReset() {
    setResult(null);
    setSubmittedInput(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {result ? "Your deal report" : "Analyze a listing"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {result
              ? `Report for: ${submittedInput?.title || "your listing"}`
              : "Paste a listing from any Lebanese marketplace platform to get a full buyer report."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: Form or Results */}
          <div>
            {!result ? (
              <AnalyzerForm
                key={`analyzer-${isDemo ? "demo" : "live"}-${categoryParam ?? "none"}`}
                initialCategory={categoryParam || undefined}
                onResult={handleResult}
                isDemo={isDemo}
              />
            ) : (
              <div ref={resultRef} className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Based on your listing description</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="rounded-full gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Analyze another
                  </Button>
                </div>

                <VerdictCard
                  verdict={result.verdict}
                  verdictLabel={result.verdictLabel}
                  verdictExplanation={result.verdictExplanation}
                />

                {submittedInput && <ReportActionsCard result={result} input={submittedInput} />}

                <SellerTrustCard sellerTrust={result.sellerTrust} />

                <ConfidenceCard
                  confidence={result.confidence}
                  reason={result.confidenceReason}
                />

                <RiskScoreCard
                  score={result.riskScore}
                  explanation={result.riskExplanation}
                />

                <PriceCheckCard priceCheck={result.priceCheck} />

                <MarketComparisonCard
                  comparison={result.marketComparison}
                  currency={result.priceCheck.currency}
                />

                <ScamPatternsCard patterns={result.scamPatterns} />

                <RedFlagsCard redFlags={result.redFlags} />

                <SellerQuestionsCard questions={result.sellerQuestions} />

                <NegotiationScriptCard script={result.negotiationScript} />

                <BuyerChecklistCard checklist={result.buyerChecklist} />

                <Alert className="rounded-2xl border">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs leading-relaxed">
                    {result.disclaimer}
                  </AlertDescription>
                </Alert>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full rounded-full gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Check another listing
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {!result ? (
                <>
                  <div className="rounded-2xl border bg-card p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Tips for better results</p>
                    <Separator />
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      {[
                        "Paste the full listing text, not just a summary",
                        "Include any messages you received from the seller",
                        "Mention mileage and condition details if you know them",
                        "Add 3 or more comparable prices for median comparison",
                        "The more you give, the higher the confidence score",
                      ].map((tip) => (
                        <li key={tip} className="flex items-start gap-2">
                          <ChevronDown className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0 -rotate-90" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border bg-card p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">What you&apos;ll get</p>
                    <Separator />
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {[
                        "Risk score (1–10)",
                        "Price reality check",
                        "Seller trust status",
                        "Comparable listing median",
                        "Scam pattern warnings",
                        "Red flags detected",
                        "Questions to ask the seller",
                        "Ready-to-send negotiation message",
                        "Buyer checklist",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border bg-card p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Quick summary</p>
                  <Separator />
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verdict</span>
                      <span className="font-semibold">{result.verdictLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk score</span>
                      <span className="font-semibold">{result.riskScore.toFixed(1)} / 10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Red flags</span>
                      <span className="font-semibold">{result.redFlags.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-semibold capitalize">{result.confidence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested offer</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {result.priceCheck.currency === "USD" ? "$" : ""}
                        {result.priceCheck.suggestedOffer.toLocaleString()}
                        {result.priceCheck.currency === "LBP" ? " LBP" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
