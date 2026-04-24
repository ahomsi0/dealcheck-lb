import {
  TrendingDown,
  AlertCircle,
  FileX,
  Wrench,
  Zap,
  DollarSign,
} from "lucide-react";

const checks = [
  {
    icon: TrendingDown,
    title: "Price mismatch",
    description:
      "We compare the asking price against estimated market ranges for the category in Lebanon. You'll know immediately if it's too high or suspiciously low.",
  },
  {
    icon: AlertCircle,
    title: "Scam signals",
    description:
      "We flag patterns common in marketplace scams: pressure tactics, account mismatch, requests for deposits before viewing, urgent language.",
  },
  {
    icon: FileX,
    title: "Missing information",
    description:
      "A trustworthy seller should provide complete details. We detect when key info — mileage, specs, condition, receipts — is absent from the listing.",
  },
  {
    icon: Wrench,
    title: "Maintenance history",
    description:
      "For vehicles and electronics, service records directly affect value and reliability. We highlight when this critical information is not disclosed.",
  },
  {
    icon: Zap,
    title: "Seller pressure tactics",
    description:
      'We detect language designed to rush you: "final price", "no timewasters", "urgent", "today only". Real sellers are patient.',
  },
  {
    icon: DollarSign,
    title: "Negotiation opportunities",
    description:
      "We identify leverage points — missing info, high risk score, above-market pricing — and give you a ready-to-send negotiation message.",
  },
];

export function WhatWeLookFor() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Analysis criteria</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What DealCheck looks for
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Every listing is run through a structured set of checks specific to the item category and the Lebanese market context.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((check) => (
            <div
              key={check.title}
              className="group rounded-2xl border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 group-hover:bg-primary/15 transition-colors">
                <check.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{check.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{check.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
