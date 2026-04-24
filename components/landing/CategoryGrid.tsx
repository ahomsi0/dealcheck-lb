import Link from "next/link";
import { Car, Bike, Laptop, Smartphone, Armchair, Tv, Refrigerator, Package } from "lucide-react";

const categories = [
  { icon: Car, label: "Cars", href: "/analyze?category=car", description: "Sedans, SUVs, hatchbacks" },
  { icon: Bike, label: "Motorcycles", href: "/analyze?category=motorcycle", description: "Scooters, sport bikes" },
  { icon: Laptop, label: "Laptops", href: "/analyze?category=laptop", description: "MacBooks, Windows, gaming" },
  { icon: Smartphone, label: "Phones", href: "/analyze?category=phone", description: "iPhones, Android, tablets" },
  { icon: Armchair, label: "Office Chairs", href: "/analyze?category=office-chair", description: "Herman Miller, Secretlab & more" },
  { icon: Tv, label: "Electronics", href: "/analyze?category=electronics", description: "TVs, cameras, audio" },
  { icon: Refrigerator, label: "Appliances", href: "/analyze?category=appliance", description: "Fridges, washers, ACs" },
  { icon: Package, label: "Other", href: "/analyze?category=other", description: "Furniture, tools & more" },
];

export function CategoryGrid() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Categories</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Supported item types
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Each category has a dedicated set of checks and red flags tailored to what matters most for that item type.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 group-hover:bg-primary/15 transition-colors">
                <cat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
