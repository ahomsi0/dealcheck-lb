"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6">
            <div>
              <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium tracking-wide">
                Built for the Lebanese market
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                Check if a deal is{" "}
                <span className="text-primary">actually worth it</span>{" "}
                before you buy.
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Paste any Lebanese marketplace listing and get a risk score, price reality check, red flags, questions to ask, and negotiation advice — instantly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/analyze"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8 font-semibold")}
              >
                Analyze a listing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/analyze?demo=true"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
              >
                See example report
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { label: "Works with Facebook, OLX, WhatsApp & more" },
                { label: "Cars, phones, laptops & more" },
                { label: "No account needed" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock report card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl blur-2xl" />
            <Card className="relative border shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-muted/50 border-b px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">deal-report.dealcheck.lb</span>
              </div>
              <CardContent className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Listing</p>
                  <p className="font-semibold text-sm">2018 Toyota Corolla — $9,500 — Beirut</p>
                </div>

                {/* Verdict */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Overall verdict</p>
                    <p className="font-bold text-amber-600 dark:text-amber-400">Slightly Overpriced</p>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/15">
                    Caution
                  </Badge>
                </div>

                {/* Risk Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Score</span>
                    <span className="font-bold text-foreground">6.8 / 10</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: "68%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Lower is safer. Higher means more caution needed.</p>
                </div>

                {/* Price */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 rounded-xl bg-muted/60 border">
                    <p className="text-xs text-muted-foreground mb-1">Suggested offer</p>
                    <p className="font-bold text-green-600 dark:text-green-400">$8,200</p>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Red Flags</p>
                  {[
                    { text: "No service history mentioned", color: "text-red-500" },
                    { text: "Vague listing description", color: "text-amber-500" },
                    { text: "Urgent sale wording detected", color: "text-amber-500" },
                    { text: "Mileage not mentioned", color: "text-red-500" },
                  ].map((flag) => (
                    <div key={flag.text} className="flex items-center gap-2 text-xs">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${flag.color}`} />
                      <span className="text-foreground/80">{flag.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                  <TrendingDown className="h-3.5 w-3.5 text-primary" />
                  Suggested negotiation script included
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
