"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/analyze", label: "Analyzer" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/dealcheck-logo-mark.svg"
              alt="DealCheck LB logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
              priority
            />
            <span className="font-bold text-lg tracking-tight">
              DealCheck <span className="text-primary">LB</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/analyze"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full px-5")}
            >
              Analyze now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/analyze"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants(), "w-full rounded-full mt-2 justify-center")}
          >
            Analyze now
          </Link>
        </div>
      )}
    </header>
  );
}
