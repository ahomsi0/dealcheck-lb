"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Info,
  Link2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { ListingInput, Category, Currency, DealAnalysis } from "@/lib/types";
import type { ScrapedListing } from "@/lib/scrapeUtils";
import { generateMockAnalysis } from "@/lib/mockAnalysis";
import { cn } from "@/lib/utils";

interface AnalyzerFormProps {
  initialCategory?: Category;
  onResult: (result: DealAnalysis, input: ListingInput) => void;
  isDemo?: boolean;
}

interface ScrapeResponse extends ScrapedListing {
  blocked?: boolean;
  blockedReason?: string;
  blockedInstructions?: string[];
  error?: string;
}

const DEMO_INPUT: ListingInput = {
  title: "2018 Toyota Corolla — Automatic",
  category: "car",
  askingPrice: 9500,
  currency: "USD",
  location: "Beirut, Hamra",
  listingText:
    "Toyota Corolla 2018 automatic, color silver, full options, sunroof, leather seats. Urgent sale, final price. No service history but car runs great. Minor scratches, needs nothing. No timewasters please.",
  sellerNotes: "Moving abroad, need to sell quickly. Price is firm.",
  sellerVerified: undefined,
  sellerType: undefined,
  comparableListings: "8700\n9200\n9100\n8500",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  price: "Price",
  currency: "Currency",
  location: "Location",
  description: "Description",
  category: "Category",
  sellerVerified: "Seller Verified",
  sellerType: "Seller Type",
};

export function AnalyzerForm({ initialCategory, onResult, isDemo }: AnalyzerFormProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<ScrapeResponse | null>(null);
  const [scraped, setScraped] = useState<ScrapedListing | null>(null);
  const listingTextRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<ListingInput>(() =>
    isDemo
      ? { ...DEMO_INPUT }
      : {
          listingUrl: "",
          title: "",
          category: initialCategory || "car",
          askingPrice: 0,
          currency: "USD",
          location: "",
          listingText: "",
          sellerNotes: "",
          sellerVerified: undefined,
          sellerType: undefined,
          comparableListings: "",
        }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ListingInput, string>>>({});

  // ─── URL fetch ─────────────────────────────────────────────────────────

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setUrlError(null);
    setScraped(null);
    setBlocked(null);
    setFetching(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data: ScrapeResponse = await res.json();

      if (!res.ok) {
        setUrlError(data.error ?? "Failed to fetch the listing.");
        return;
      }

      // Blocked domain (Facebook, Instagram, etc.) — show instructions, don't error
      if (data.blocked) {
        setBlocked(data);
        // Scroll to the listing text field so they know where to paste
        setTimeout(() => listingTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
        return;
      }

      setScraped(data);

      // Auto-populate form with whatever was found
      setForm((prev) => ({
        ...prev,
        listingUrl: urlInput.trim(),
        title: data.title ?? prev.title,
        category: data.category ?? prev.category,
        askingPrice: data.price ?? prev.askingPrice,
        currency: data.currency ?? prev.currency,
        location: data.location ?? prev.location,
        listingText: data.description
          ? data.description + (prev.listingText ? "\n\n" + prev.listingText : "")
          : prev.listingText,
        sellerVerified: data.sellerVerified ?? prev.sellerVerified,
        sellerType: data.sellerType ?? prev.sellerType,
      }));

      // Clear errors for fields that got filled
      const cleared: Partial<Record<keyof ListingInput, string>> = {};
      if (data.title) cleared.title = undefined;
      if (data.price) cleared.askingPrice = undefined;
      if (data.description) cleared.listingText = undefined;
      setErrors((e) => ({ ...e, ...cleared }));
    } catch {
      setUrlError("Something went wrong. Check the URL and try again.");
    } finally {
      setFetching(false);
    }
  }

  function clearUrl() {
    setUrlInput("");
    setUrlError(null);
    setScraped(null);
    setBlocked(null);
  }

  // ─── Form submit ───────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof ListingInput, string>> = {};
    if (!form.title.trim()) e.title = "Please enter a listing title";
    if (!form.askingPrice || form.askingPrice <= 0) e.askingPrice = "Enter a valid asking price";
    if (!form.listingText.trim() || form.listingText.trim().length < 10)
      e.listingText = "Paste at least a few words from the listing";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1200));
    const result = generateMockAnalysis(form);
    try {
      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: form, analysis: result }),
      });
    } catch {
      // Saving should never block the buyer from seeing the report.
    }
    setAnalyzing(false);
    onResult(result, form);
  }

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const filledByUrl = scraped?.fieldsFound ?? [];

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── URL paste section ── */}
      <Card className="rounded-2xl border">
        <CardContent className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Paste a listing URL</p>
              <p className="text-xs text-muted-foreground">
                OLX Lebanon, Dubizzle — we&apos;ll fill the form automatically
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="https://www.olx.com.lb/ad/..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(null);
                  if (blocked) setBlocked(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                className={cn("pr-8", urlError ? "border-destructive" : "")}
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={clearUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear URL"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchUrl}
              disabled={fetching || !urlInput.trim()}
              className="shrink-0 rounded-xl gap-2"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Auto-fill
                </>
              )}
            </Button>
          </div>

          {/* Generic fetch error */}
          {urlError && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">{urlError}</p>
            </div>
          )}

          {/* Facebook / blocked domain — show how-to instructions */}
          {blocked && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-500/15">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {blocked.source} requires login
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    {blocked.blockedReason}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  How to fill the form manually
                </p>
                <ol className="space-y-1.5">
                  {blocked.blockedInstructions?.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => {
                    listingTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    listingTextRef.current?.focus();
                  }}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Jump to listing text field <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Success — fields found */}
          {scraped && !urlError && filledByUrl.length > 0 && (
            <div className="rounded-xl bg-green-500/8 border border-green-500/20 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Filled {filledByUrl.length} field{filledByUrl.length !== 1 ? "s" : ""} from {scraped.source}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filledByUrl.map((f) => (
                  <Badge
                    key={f}
                    className="text-xs rounded-full h-4 px-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15 gap-1"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {FIELD_LABELS[f] ?? f}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Review the fields below and fill in anything missing.
              </p>

              {(scraped.sellerVerified !== undefined || scraped.sellerType) && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">
                    Seller status:{" "}
                    <span className="font-medium text-foreground">
                      {scraped.sellerVerified === true
                        ? "Verified"
                        : scraped.sellerVerified === false
                          ? "Not verified"
                          : "Unknown"}
                    </span>
                    {scraped.sellerType ? (
                      <>
                        {" "}
                        •{" "}
                        <span className="font-medium text-foreground capitalize">
                          {scraped.sellerType}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Scrape warning — e.g. description truncated on OLX */}
          {scraped?.warning && !urlError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {scraped.warning}
                </p>
              </div>
              <div className="border-t border-amber-500/15 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    listingTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    listingTextRef.current?.focus();
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Jump to listing text field <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Main form ── */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Listing details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filledByUrl.length > 0
                  ? "Review the pre-filled fields and add anything that's missing."
                  : "Fill in what you know. More detail = better analysis."}
              </p>
            </div>
            {isDemo && (
              <Badge variant="secondary" className="shrink-0 rounded-full">
                Demo listing
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Title */}
            <FieldWrapper label="Listing title" required filled={filledByUrl.includes("title")} error={errors.title}>
              <Input
                placeholder="e.g. 2018 Toyota Corolla — Automatic — Beirut"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={errors.title ? "border-destructive" : ""}
              />
            </FieldWrapper>

            {/* Category + Currency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label="Category" filled={filledByUrl.includes("category")}>
                <Select value={form.category} onValueChange={(v) => set("category", v as Category)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="office-chair">Office Chair</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>

              <FieldWrapper label="Currency" filled={filledByUrl.includes("currency")}>
                <Select value={form.currency} onValueChange={(v) => set("currency", v as Currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="LBP">LBP (ل.ل)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </div>

            {/* Price + Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label="Asking price" required filled={filledByUrl.includes("price")} error={errors.askingPrice}>
                <Input
                  type="number"
                  placeholder={form.currency === "USD" ? "e.g. 9500" : "e.g. 85000000"}
                  value={form.askingPrice || ""}
                  onChange={(e) => set("askingPrice", parseFloat(e.target.value) || 0)}
                  className={errors.askingPrice ? "border-destructive" : ""}
                />
              </FieldWrapper>

              <FieldWrapper label="Location" filled={filledByUrl.includes("location")}>
                <Input
                  placeholder="e.g. Beirut, Jounieh"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </FieldWrapper>
            </div>

            <Separator />

            {/* Listing text */}
            <FieldWrapper
              label="Listing text"
              required
              filled={filledByUrl.includes("description")}
              error={errors.listingText}
              hint="More text = higher confidence analysis"
              wordCount={form.listingText.trim().split(/\s+/).filter(Boolean).length}
            >
              <Textarea
                ref={listingTextRef}
                placeholder="Paste the full listing description here — from Facebook, WhatsApp, OLX, Dubizzle, wherever."
                value={form.listingText}
                onChange={(e) => set("listingText", e.target.value)}
                className={`min-h-[160px] resize-y ${errors.listingText ? "border-destructive" : ""}`}
              />
            </FieldWrapper>

            {/* Seller notes */}
            <FieldWrapper label="Seller notes" optional>
              <Textarea
                placeholder="Any extra info from the seller — messages, WhatsApp, context. Optional but helpful."
                value={form.sellerNotes}
                onChange={(e) => set("sellerNotes", e.target.value)}
                className="min-h-[90px] resize-y"
              />
            </FieldWrapper>

            {/* Comparable listings */}
            <FieldWrapper label="Comparable prices" optional hint="Paste 3+ similar listing prices, one per line">
              <Textarea
                placeholder="e.g.&#10;$8,700&#10;$9,200&#10;$8,900"
                value={form.comparableListings ?? ""}
                onChange={(e) => set("comparableListings", e.target.value)}
                className="min-h-[90px] resize-y"
              />
            </FieldWrapper>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full font-semibold text-base"
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking price, risk, and red flags…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analyze Deal
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              DealCheck gives guidance, not a guarantee. Always inspect before buying.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  filled?: boolean;
  error?: string;
  hint?: string;
  wordCount?: number;
  children: React.ReactNode;
}

function FieldWrapper({ label, required, optional, filled, error, hint, wordCount, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {optional && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
        </label>
        {filled && (
          <Badge className="text-xs rounded-full h-4 px-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25 hover:bg-green-500/15 gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Auto-filled
          </Badge>
        )}
      </div>
      {children}
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {hint}
          </p>
        ) : (
          <span />
        )}
        {wordCount !== undefined && (
          <p className="text-xs text-muted-foreground">{wordCount} words</p>
        )}
      </div>
    </div>
  );
}
