import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, HelpCircle, ShieldAlert } from "lucide-react";
import type { SellerTrust } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SellerTrustCardProps {
  sellerTrust: SellerTrust;
}

const config = {
  positive: {
    icon: BadgeCheck,
    badge: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15",
  },
  neutral: {
    icon: HelpCircle,
    badge: "bg-muted text-muted-foreground border-border hover:bg-muted",
  },
  caution: {
    icon: ShieldAlert,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
  },
};

export function SellerTrustCard({ sellerTrust }: SellerTrustCardProps) {
  const item = config[sellerTrust.status];
  const Icon = item.icon;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Seller Trust
            </span>
          </div>
          <Badge className={cn("rounded-full text-xs", item.badge)}>{sellerTrust.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <p className="text-sm text-muted-foreground leading-relaxed">{sellerTrust.description}</p>
      </CardContent>
    </Card>
  );
}
