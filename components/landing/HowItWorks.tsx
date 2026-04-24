import { ClipboardList, Tag, FileText } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Paste the listing",
    description:
      "Copy the full listing text from Facebook Marketplace, OLX, Dubizzle, WhatsApp, or anywhere else. The more detail you include, the better the analysis.",
  },
  {
    icon: Tag,
    step: "02",
    title: "Choose a category",
    description:
      "Select the item type — car, motorcycle, laptop, phone, office chair, or general electronics. Each category has tailored checks.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Get your buyer report",
    description:
      "Receive a full breakdown: risk score, price check, red flags, seller questions, and a ready-to-send negotiation message.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three steps to a smarter purchase
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative flex flex-col gap-4">
              {index < steps.length - 1 && (
                <div className="absolute top-8 left-[calc(100%_-_1rem)] hidden md:block w-1/2 h-px bg-border" />
              )}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-5xl font-black text-border select-none">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
