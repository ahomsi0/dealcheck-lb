import { MapPin, MessageCircle, AlertTriangle, Users } from "lucide-react";

export function BuiltForLebanon() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Local context</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
              Built for Lebanon&apos;s marketplace reality
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Lebanon&apos;s second-hand market doesn&apos;t work like a traditional classified site. Prices are inconsistent, listings are informal, and deals happen through Facebook groups, WhatsApp messages, and word-of-mouth — with very little buyer protection.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              DealCheck is designed with this in mind. We don&apos;t assume prices follow a stable national index. We factor in local patterns, informal listing styles, and the risks specific to buying second-hand in Lebanon.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: MessageCircle, label: "Facebook Marketplace & Groups" },
                { icon: MapPin, label: "OLX Lebanon & Dubizzle" },
                { icon: Users, label: "WhatsApp seller listings" },
                { icon: AlertTriangle, label: "Informal dealership sales" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Prices vary wildly",
                body: "The same 2019 iPhone can be listed for $350 or $700 on the same day. We help you figure out where reality lies.",
              },
              {
                title: "Listings are often incomplete",
                body: "Many Lebanese sellers don&apos;t include mileage, specs, or condition details. We flag what&apos;s missing.",
              },
              {
                title: "No formal buyer protection",
                body: "Unlike Amazon or eBay, local marketplaces offer zero recourse. Due diligence is your only protection.",
              },
              {
                title: "Currency confusion",
                body: "Listings mix USD and LBP at different rates. We handle both currencies with context.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <h4 className="font-semibold text-foreground mb-1.5">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
