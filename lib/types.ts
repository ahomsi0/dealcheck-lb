export type Category =
  | "car"
  | "motorcycle"
  | "laptop"
  | "phone"
  | "office-chair"
  | "electronics"
  | "appliance"
  | "other";

export type Currency = "USD" | "LBP";

export interface ListingInput {
  listingUrl?: string;
  title: string;
  category: Category;
  askingPrice: number;
  currency: Currency;
  location: string;
  listingText: string;
  sellerNotes: string;
  sellerVerified?: boolean;
  sellerType?: "individual" | "agency";
  comparableListings?: string;
}

export type PriceVerdict =
  | "fair"
  | "slightly-overpriced"
  | "very-overpriced"
  | "suspiciously-cheap"
  | "unknown";

export type RiskVerdict =
  | "good-deal"
  | "fair"
  | "overpriced"
  | "high-risk"
  | "suspiciously-cheap";

export interface RedFlag {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
}

export interface SellerQuestion {
  id: string;
  question: string;
  why: string;
}

export interface PriceCheck {
  listedPrice: number;
  currency: Currency;
  /** Opening offer to start negotiation — always below asking */
  suggestedOffer: number;
  /** Most you should realistically pay — always below asking */
  maxRecommended: number;
  /** How much you could save if negotiation succeeds */
  potentialSaving: number;
  verdict: PriceVerdict;
  verdictLabel: string;
  /** Short explanation of the negotiation basis */
  basisNote: string;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface SellerTrust {
  label: string;
  status: "positive" | "neutral" | "caution";
  description: string;
}

export interface MarketComparison {
  sampleSize: number;
  medianPrice: number;
  lowPrice: number;
  highPrice: number;
  deltaPercent: number;
  label: string;
  description: string;
}

export interface ScamPattern {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
}

export interface DealAnalysis {
  verdict: RiskVerdict;
  verdictLabel: string;
  verdictExplanation: string;
  sellerTrust: SellerTrust;
  marketComparison?: MarketComparison;
  scamPatterns: ScamPattern[];
  riskScore: number;
  riskExplanation: string;
  priceCheck: PriceCheck;
  redFlags: RedFlag[];
  sellerQuestions: SellerQuestion[];
  negotiationScript: string;
  buyerChecklist: string[];
  confidence: ConfidenceLevel;
  confidenceReason: string;
  disclaimer: string;
}
