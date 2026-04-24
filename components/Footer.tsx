import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-muted/20 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/dealcheck-logo-mark.svg"
                alt="DealCheck LB logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg"
              />
              <span className="font-bold text-lg tracking-tight">DealCheck <span className="text-primary">LB</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A buyer protection tool for the Lebanese marketplace. Paste a listing, get the full picture.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/analyze" className="hover:text-foreground transition-colors">Analyze a listing</Link></li>
              <li><Link href="/#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/analyze?demo=true" className="hover:text-foreground transition-colors">Example report</Link></li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Disclaimer</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DealCheck provides guidance based on listing descriptions, not a guarantee. Price estimates are based on typical Lebanese market patterns and may not reflect current rates. Always inspect an item in person before paying.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DealCheck LB. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Built to protect Lebanese buyers
          </p>
        </div>
      </div>
    </footer>
  );
}
