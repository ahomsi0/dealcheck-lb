import type {
  ListingInput,
  DealAnalysis,
  RedFlag,
  SellerQuestion,
  PriceVerdict,
  RiskVerdict,
  ConfidenceLevel,
  SellerTrust,
  MarketComparison,
  ScamPattern,
} from "./types";

const SUSPICIOUS_WORDS = [
  "urgent",
  "final price",
  "no timewasters",
  "like new",
  "minor issue",
  "needs nothing",
  "as is",
  "quick sale",
  "need money",
  "leaving country",
  "no negotiation",
  "serious buyers only",
  "not accepting offers",
];

const POSITIVE_WORDS = [
  "service history",
  "full service",
  "original",
  "receipt",
  "warranty",
  "inspection welcome",
  "mechanic",
  "well maintained",
  "clean",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function detectSuspiciousWords(text: string): string[] {
  const lower = text.toLowerCase();
  return SUSPICIOUS_WORDS.filter((w) => lower.includes(w));
}

function detectPositiveWords(text: string): string[] {
  const lower = text.toLowerCase();
  return POSITIVE_WORDS.filter((w) => lower.includes(w));
}

function buildSellerTrust(input: ListingInput): SellerTrust {
  const sellerType = input.sellerType === "agency" ? "agency seller" : "individual seller";

  if (input.sellerVerified === true) {
    return {
      label: `Verified ${sellerType}`,
      status: "positive",
      description:
        "OLX marks this seller as verified. That lowers platform-trust risk, but you should still inspect the item and documents before paying.",
    };
  }

  if (input.sellerVerified === false) {
    return {
      label: `Unverified ${sellerType}`,
      status: "caution",
      description:
        "This seller is not marked as verified. Treat payment, identity, and inspection steps with extra care.",
    };
  }

  return {
    label: input.sellerType === "agency" ? "Agency seller" : "Seller status unknown",
    status: "neutral",
    description:
      "DealCheck could not confirm seller verification from the listing. Use the checks below before making any payment.",
  };
}

function parseComparablePrices(text: string): number[] {
  const matches = text.match(/\$?\s*\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
  return matches
    .map((value) => Number(value.replace(/[$,\s]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function buildMarketComparison(input: ListingInput): MarketComparison | undefined {
  const prices = parseComparablePrices(input.comparableListings ?? "");
  if (prices.length < 3) return undefined;

  const sorted = [...prices].sort((a, b) => a - b);
  const medianPrice = median(sorted);
  const lowPrice = sorted[0];
  const highPrice = sorted[sorted.length - 1];
  const deltaPercent = Math.round(((input.askingPrice - medianPrice) / medianPrice) * 100);

  let label = "Close to comps";
  let description = "The asking price is close to the median of the comparable prices you pasted.";
  if (deltaPercent >= 15) {
    label = "Above pasted comps";
    description = "The asking price is meaningfully above the median of your comparable listings.";
  } else if (deltaPercent <= -15) {
    label = "Below pasted comps";
    description = "The asking price is meaningfully below the median. Verify condition, ownership, and urgency carefully.";
  }

  return {
    sampleSize: prices.length,
    medianPrice,
    lowPrice,
    highPrice,
    deltaPercent,
    label,
    description,
  };
}

function computeConfidence(input: ListingInput): {
  level: ConfidenceLevel;
  reason: string;
} {
  const wordCount = countWords(input.listingText);
  const hasTitle = input.title.trim().length > 3;
  const hasLocation = input.location.trim().length > 1;
  const positives = detectPositiveWords(
    input.listingText + " " + input.sellerNotes
  );

  let score = 0;
  if (wordCount > 80) score += 3;
  else if (wordCount > 40) score += 2;
  else if (wordCount > 15) score += 1;
  if (hasTitle) score += 1;
  if (hasLocation) score += 1;
  if (input.sellerNotes.trim().length > 10) score += 1;
  if (positives.length > 0) score += 1;

  if (score >= 6)
    return {
      level: "high",
      reason: "Enough listing detail for a reliable assessment.",
    };
  if (score >= 3)
    return {
      level: "medium",
      reason:
        "Some details are present but the listing is incomplete. Results are estimates based on what was provided.",
    };
  return {
    level: "low",
    reason:
      "Very little information provided. Treat all results with extra caution — paste more of the listing for a better analysis.",
  };
}

/**
 * Computes negotiation targets — always below the asking price.
 *
 * We do NOT have access to real Lebanese market price data.
 * What we CAN do is use risk factors (missing info, pressure tactics,
 * red flags) to tell the buyer how hard to negotiate and where to stop.
 *
 * Suggested offer = your opening bid (aggressive but realistic)
 * Max recommended = the most you should pay before walking away
 *
 * Both are always below the asking price.
 */
function buildPriceCheck(
  input: ListingInput,
  riskScore: number,
  susWords: string[],
  redFlagCount: number
) {
  const asking = input.askingPrice;
  const hasUrgency = susWords.some((w) =>
    ["urgent", "quick sale", "need money", "leaving country"].includes(w)
  );
  const hasFinalPrice = susWords.some((w) =>
    ["final price", "no negotiation", "not accepting offers"].includes(w)
  );

  // Opening offer discount — how far below asking to start negotiations
  // Higher risk = more negotiating room, because more unknowns = more risk for buyer
  let openingDiscountPct: number;
  if (riskScore >= 8) openingDiscountPct = 0.25;
  else if (riskScore >= 6.5) openingDiscountPct = 0.20;
  else if (riskScore >= 5) openingDiscountPct = 0.15;
  else if (riskScore >= 3.5) openingDiscountPct = 0.10;
  else openingDiscountPct = 0.06;

  // Urgency gives you extra leverage — seller needs to move fast
  if (hasUrgency) openingDiscountPct = Math.min(openingDiscountPct + 0.05, 0.35);

  // Max recommended — less aggressive, but still always below asking
  // If seller says "final price", you still have some room — that's often a bluff
  let maxDiscountPct: number;
  if (hasFinalPrice) {
    maxDiscountPct = Math.max(openingDiscountPct - 0.08, 0.03);
  } else {
    maxDiscountPct = Math.max(openingDiscountPct - 0.10, 0.03);
  }

  const suggestedOffer = Math.round(asking * (1 - openingDiscountPct));
  const maxRecommended = Math.round(asking * (1 - maxDiscountPct));
  const potentialSaving = asking - suggestedOffer;

  // Verdict is based on listing quality and risk, not a fake price lookup
  let verdict: PriceVerdict;
  let verdictLabel: string;
  let basisNote: string;

  if (riskScore >= 8 || redFlagCount >= 5) {
    verdict = "very-overpriced";
    verdictLabel = "Negotiate Hard";
    basisNote =
      "Multiple red flags and missing information mean the seller has less leverage. Start significantly below asking.";
  } else if (riskScore >= 5.5 || redFlagCount >= 3) {
    verdict = "slightly-overpriced";
    verdictLabel = "Room to Negotiate";
    basisNote =
      "Several unknowns in this listing give you negotiating leverage. Don't pay full asking.";
  } else if (riskScore <= 3) {
    verdict = "fair";
    verdictLabel = "Reasonably Listed";
    basisNote =
      "The listing is reasonably detailed with few red flags. Some negotiation is still normal — try 5–8% below asking.";
  } else {
    verdict = "fair";
    verdictLabel = "Verify Before Deciding";
    basisNote =
      "Moderate risk. Negotiate based on what you find during inspection — use the questions below as leverage.";
  }

  return {
    listedPrice: asking,
    currency: input.currency,
    suggestedOffer,
    maxRecommended,
    potentialSaving,
    verdict,
    verdictLabel,
    basisNote,
  };
}

function buildRedFlags(input: ListingInput, susWords: string[]): RedFlag[] {
  const flags: RedFlag[] = [];
  const text = (input.listingText + " " + input.sellerNotes).toLowerCase();
  const wordCount = countWords(input.listingText);

  if (susWords.includes("urgent") || susWords.includes("quick sale")) {
    flags.push({
      id: "urgent-sale",
      severity: "medium",
      title: "Urgent sale language detected",
      description:
        'The listing uses pressure words like "urgent" or "quick sale". This can be genuine, but is also commonly used to rush buyers into skipping proper inspection.',
    });
  }

  if (susWords.includes("no timewasters")) {
    flags.push({
      id: "no-timewasters",
      severity: "low",
      title: '"No timewasters" wording',
      description:
        "This phrase often signals a seller who is unwilling to allow inspection or negotiation. Any serious seller should welcome genuine questions.",
    });
  }

  if (susWords.includes("final price") || susWords.includes("no negotiation")) {
    flags.push({
      id: "final-price",
      severity: "low",
      title: "Seller claims price is final",
      description:
        'Stating "final price" is often a negotiating tactic. In Lebanon\'s informal market, most prices have room. If something comes up during inspection, you have every right to renegotiate.',
    });
  }

  if (wordCount < 20) {
    flags.push({
      id: "vague-description",
      severity: "medium",
      title: "Vague or very short description",
      description:
        "The listing contains very little detail. A seller with nothing to hide should be able to describe the item thoroughly. Short listings are often copied or rushed.",
    });
  }

  if (["car", "motorcycle"].includes(input.category)) {
    const hasServiceHistory =
      text.includes("service") || text.includes("maintenance") || text.includes("full history");
    const hasAccident =
      text.includes("accident") ||
      text.includes("accidented") ||
      text.includes("no accident") ||
      text.includes("clean title");
    const hasMileage = /\d+\s*(km|miles|kms)/.test(text);
    const hasRegistration =
      text.includes("registration") ||
      text.includes("registered") ||
      text.includes("mechanique") ||
      text.includes("ruhksa");

    if (!hasServiceHistory) {
      flags.push({
        id: "no-service-history",
        severity: "high",
        title: "No service history mentioned",
        description:
          "Service records are the most critical factor when buying a used vehicle. Their absence — or refusal to provide them — is a major red flag. Always ask for the full maintenance history.",
      });
    }
    if (!hasAccident) {
      flags.push({
        id: "accident-unknown",
        severity: "medium",
        title: "Accident history not disclosed",
        description:
          "The listing makes no mention of accident history. In Lebanon, many vehicles are repaired informally without proper records. Always ask explicitly and request a body inspection.",
      });
    }
    if (!hasMileage) {
      flags.push({
        id: "no-mileage",
        severity: "high",
        title: "Mileage not stated",
        description:
          "Mileage is one of the primary factors in pricing a vehicle. Omitting it is unusual for a legitimate seller — it may indicate high mileage the seller wants to hide.",
      });
    }
    if (!hasRegistration) {
      flags.push({
        id: "no-registration",
        severity: "medium",
        title: "Registration (mechanique) status not mentioned",
        description:
          "Lebanese vehicle inspection (mechanique) renewal costs and status directly affect the true cost of ownership. Always confirm registration is current before agreeing to a price.",
      });
    }
  }

  if (["laptop", "phone"].includes(input.category)) {
    const hasBattery = text.includes("battery");
    const hasWarranty = text.includes("warranty") || text.includes("guarantee");
    const hasRepair =
      text.includes("repaired") ||
      text.includes("fixed") ||
      text.includes("screen replaced") ||
      text.includes("changed screen");
    const hasAccountLock =
      text.includes("icloud") || text.includes("google account") || text.includes("unlocked");

    if (!hasBattery) {
      flags.push({
        id: "no-battery-info",
        severity: "medium",
        title: "Battery health not mentioned",
        description:
          "Battery health directly affects value and usability. For iPhones, ask to see Settings > Battery Health. For laptops, ask to run a battery report. A seller who refuses is hiding something.",
      });
    }
    if (!hasWarranty) {
      flags.push({
        id: "no-warranty",
        severity: "low",
        title: "No warranty information",
        description:
          "No mention of remaining warranty. In Lebanon, many electronics are grey imports with no local warranty — confirm this before buying.",
      });
    }
    if (hasRepair) {
      flags.push({
        id: "previously-repaired",
        severity: "medium",
        title: "Device has been repaired",
        description:
          "The listing or notes mention a repair. Non-original screens, batteries, or parts affect resale value and can cause future issues. Ask exactly what was replaced and where.",
      });
    }
    if (!hasAccountLock) {
      flags.push({
        id: "account-lock-unknown",
        severity: "high",
        title: "Account lock status not mentioned",
        description:
          "iCloud-locked iPhones and Google-locked Android phones are unusable. This is one of the most common scams in Lebanese phone listings. Always factory reset and verify in person before paying.",
      });
    }
  }

  if (input.category === "office-chair") {
    const knownBrands = ["herman miller", "steelcase", "secretlab", "haworth", "humanscale", "ergohuman"];
    const mentionsBrand = knownBrands.some((b) => text.includes(b));
    if (!mentionsBrand && wordCount < 30) {
      flags.push({
        id: "unverified-brand",
        severity: "medium",
        title: "Brand or authenticity unclear",
        description:
          "Premium office chair brands are widely counterfeited. Without seeing the original receipt or confirming the brand, you may be paying premium prices for a replica.",
      });
    }
  }

  if (susWords.includes("like new") && wordCount < 30) {
    flags.push({
      id: "like-new-claim",
      severity: "low",
      title: '"Like new" with no supporting detail',
      description:
        'Sellers frequently use "like new" without photos or explanation. Ask for multiple photos in natural light, and insist on an in-person inspection.',
    });
  }

  if (susWords.includes("minor issue") || susWords.includes("needs nothing")) {
    flags.push({
      id: "contradictory-claim",
      severity: "medium",
      title: "Contradictory condition claims",
      description:
        '"Needs nothing" while also mentioning a "minor issue" is contradictory. Push the seller to clearly describe any known defects before you agree to view the item.',
    });
  }

  return flags;
}

function buildScamPatterns(input: ListingInput, susWords: string[], marketComparison?: MarketComparison): ScamPattern[] {
  const text = `${input.listingText} ${input.sellerNotes}`.toLowerCase();
  const patterns: ScamPattern[] = [];

  if (text.includes("deposit") || text.includes("down payment") || text.includes("western union")) {
    patterns.push({
      id: "advance-payment",
      severity: "high",
      title: "Advance payment language",
      description:
        "The listing or seller notes mention deposit-style payment. Never send money before seeing the item and verifying ownership.",
    });
  }

  if (susWords.some((word) => ["urgent", "quick sale", "need money"].includes(word))) {
    patterns.push({
      id: "pressure",
      severity: "medium",
      title: "Pressure tactics",
      description:
        "Urgency can be legitimate, but it is also used to push buyers into skipping inspection or verification.",
    });
  }

  if (text.includes("delivery only") || text.includes("no viewing") || text.includes("cannot meet")) {
    patterns.push({
      id: "no-inspection",
      severity: "high",
      title: "Inspection avoidance",
      description:
        "A seller who avoids in-person inspection removes your main protection. Do not pay before inspecting.",
    });
  }

  if (marketComparison && marketComparison.deltaPercent <= -25) {
    patterns.push({
      id: "too-cheap",
      severity: "medium",
      title: "Price is far below comps",
      description:
        "A very low price can be a real bargain, but it can also signal hidden defects, stolen goods, or fake listings.",
    });
  }

  return patterns;
}

function buildSellerQuestions(input: ListingInput): SellerQuestion[] {
  if (["car", "motorcycle"].includes(input.category)) {
    return [
      {
        id: "sq1",
        question: "Do you have the full service and maintenance records?",
        why: "Service history is the single most important factor for used vehicles in Lebanon — gaps suggest neglected maintenance.",
      },
      {
        id: "sq2",
        question: "Has this vehicle ever been in an accident, even a minor one? Any bodywork or repainting done?",
        why: "Many accidents in Lebanon are repaired informally. Even small past accidents reduce value significantly.",
      },
      {
        id: "sq3",
        question: "Is the mechanique (registration) up to date? When does it expire?",
        why: "Expired registration means additional cost for you. In Lebanon, some vehicles have registration issues that prevent renewal.",
      },
      {
        id: "sq4",
        question: "Can I bring my own mechanic to inspect it before committing?",
        why: "Any trustworthy seller will agree to this. Refusal is a serious red flag.",
      },
      {
        id: "sq5",
        question: "Why are you selling, and how long have you owned it?",
        why: "Short ownership periods combined with urgency often indicate a hidden problem the seller discovered.",
      },
    ];
  }

  if (["laptop", "phone"].includes(input.category)) {
    return [
      {
        id: "sq1",
        question:
          input.category === "phone"
            ? "Can you show me the battery health in Settings? (iPhone: Settings > Battery > Battery Health)"
            : "Can you run a battery report so I can see cycle count and health?",
        why: "Battery degradation is the most common hidden cost in used devices.",
      },
      {
        id: "sq2",
        question: "Has it ever been repaired? Screen, battery, board, anything?",
        why: "Non-original parts affect reliability. Third-party screens on iPhones break Face ID and True Tone.",
      },
      {
        id: "sq3",
        question:
          input.category === "phone"
            ? "Is iCloud/Google account removed? Can I factory reset it in front of me?"
            : "Can we factory reset it together before I pay?",
        why: "Account-locked devices are completely unusable — this is the most common scam in phone listings.",
      },
      {
        id: "sq4",
        question: "Is the original box and receipt available?",
        why: "Proves authenticity and purchase date. Also confirms it's not a stolen device.",
      },
      {
        id: "sq5",
        question: "Why are you selling it?",
        why: "If they upgraded or no longer need it, that's clean. Vague answers about 'needing money urgently' can hide defects.",
      },
    ];
  }

  if (input.category === "office-chair") {
    return [
      {
        id: "sq1",
        question: "Is this authentic or a replica? Do you have the original purchase receipt?",
        why: "Herman Miller and Steelcase chairs are extensively replicated. Price should reflect whether it's authentic.",
      },
      {
        id: "sq2",
        question: "Are all adjustments working — height, lumbar, armrests, recline?",
        why: "Mechanism repairs are expensive and often unavailable in Lebanon.",
      },
      {
        id: "sq3",
        question: "How long have you used it and in what environment (office or home)?",
        why: "Office use by multiple people degrades a chair far faster than home use.",
      },
      {
        id: "sq4",
        question: "Can I inspect it in person and sit in it before deciding?",
        why: "Foam compression and frame flex can't be detected from photos.",
      },
      {
        id: "sq5",
        question: "Why are you selling it?",
        why: "Genuine sellers are transparent. Vague answers paired with urgency often indicate a defect.",
      },
    ];
  }

  return [
    {
      id: "sq1",
      question: "Why are you selling, and how long have you owned it?",
      why: "Helps assess the seller's motivation and credibility.",
    },
    {
      id: "sq2",
      question: "Has it ever been repaired, modified, or had any issues?",
      why: "Undisclosed repairs and modifications are a very common issue in Lebanese marketplace listings.",
    },
    {
      id: "sq3",
      question: "Do you have the original receipt or proof of purchase?",
      why: "Proves it's not stolen and confirms the purchase date.",
    },
    {
      id: "sq4",
      question: "Can I inspect it in person before agreeing to buy?",
      why: "Never buy without a proper in-person inspection. Refusing an inspection is always a red flag.",
    },
    {
      id: "sq5",
      question: "Is the price negotiable, especially if I find any issues during inspection?",
      why: "Sets the expectation that you will negotiate based on findings — a fair and standard approach.",
    },
  ];
}

function buildNegotiationScript(
  input: ListingInput,
  suggestedOffer: number,
  redFlagCount: number
): string {
  const currency = input.currency === "USD" ? "$" : "";
  const offerStr =
    input.currency === "USD"
      ? `$${suggestedOffer.toLocaleString()}`
      : `${suggestedOffer.toLocaleString()} LBP`;

  const inspectionNote =
    input.category === "car" || input.category === "motorcycle"
      ? " — subject to a quick mechanic check"
      : input.category === "laptop" || input.category === "phone"
      ? " — once I verify it in person"
      : "";

  const flagNote =
    redFlagCount >= 5
      ? "a few things in the listing are missing"
      : redFlagCount >= 2
      ? "a couple of details I'd like to clarify first"
      : "a question or two before I come see it";

  void currency; // used in offerStr via template

  return `Hey, I saw your listing for "${input.title || "the item"}" and I'm interested.\n\nI have ${flagNote}. If everything checks out in person, I could do ${offerStr}${inspectionNote}. I'm a serious buyer and can move quickly.\n\nIs that something you'd consider?`;
}

function computeRiskScore(
  susWords: string[],
  redFlagCount: number,
  wordCount: number,
  positiveWords: string[],
  sellerVerified?: boolean
): { score: number; explanation: string } {
  let score = 3;

  score += susWords.length * 0.6;
  score += redFlagCount * 0.55;
  score -= positiveWords.length * 0.6;

  if (wordCount < 15) score += 2;
  else if (wordCount < 40) score += 1;

  // Verified sellers are not risk-free, but generally lower scam probability.
  if (sellerVerified === true) score -= 0.8;
  else if (sellerVerified === false) score += 0.4;

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  let explanation = "";
  if (score <= 3)
    explanation =
      "Low risk. The listing is reasonably detailed with no major warning signs. Still inspect before paying.";
  else if (score <= 5)
    explanation =
      "Moderate risk. Some details are missing or unclear — ask the questions below and proceed carefully.";
  else if (score <= 7)
    explanation =
      "Elevated risk. Several red flags detected. Inspect thoroughly, verify every claim, and do not pay any deposit before seeing the item.";
  else
    explanation =
      "High risk. This listing has multiple serious concerns. Do not send any money in advance. Inspect with a professional before committing.";

  return { score, explanation };
}

function getVerdict(
  priceVerdict: string,
  riskScore: number
): { verdict: RiskVerdict; label: string; explanation: string } {
  if (riskScore >= 7.5) {
    return {
      verdict: "high-risk",
      label: "High Risk",
      explanation:
        "This deal raises multiple red flags. Proceed with extreme caution — do not pay any amount upfront.",
    };
  }
  if (priceVerdict === "suspiciously-cheap") {
    return {
      verdict: "suspiciously-cheap",
      label: "Suspiciously Cheap",
      explanation:
        "The price is significantly below what similar items typically sell for. This may indicate a scam, stolen goods, or a serious undisclosed defect.",
    };
  }
  if (priceVerdict === "very-overpriced") {
    return {
      verdict: "overpriced",
      label: "Negotiate Hard",
      explanation:
        "The listing has enough red flags and missing detail to justify significant negotiation. You have leverage here.",
    };
  }
  if (riskScore <= 3 && priceVerdict === "fair") {
    return {
      verdict: "good-deal",
      label: "Looks Reasonable",
      explanation:
        "This listing appears transparent and reasonably detailed. No major red flags detected. Still inspect before buying.",
    };
  }
  if (priceVerdict === "slightly-overpriced") {
    return {
      verdict: "overpriced",
      label: "Room to Negotiate",
      explanation:
        "The listing has gaps that give you leverage. Don't pay full asking — use the negotiation script below.",
    };
  }
  return {
    verdict: "fair",
    label: "Looks Fair",
    explanation:
      "No major red flags based on the provided description. Verify the details in person before finalizing.",
  };
}

export function generateMockAnalysis(input: ListingInput): DealAnalysis {
  const fullText = input.listingText + " " + input.sellerNotes;
  const wordCount = countWords(input.listingText);
  const susWords = detectSuspiciousWords(fullText);
  const positiveWords = detectPositiveWords(fullText);
  const redFlags = buildRedFlags(input, susWords);
  const sellerTrust = buildSellerTrust(input);
  const marketComparison = buildMarketComparison(input);
  const scamPatterns = buildScamPatterns(input, susWords, marketComparison);
  const { score: riskScore, explanation: riskExplanation } = computeRiskScore(
    susWords,
    redFlags.length + scamPatterns.filter((pattern) => pattern.severity === "high").length,
    wordCount,
    positiveWords,
    input.sellerVerified
  );
  const priceCheck = buildPriceCheck(input, riskScore, susWords, redFlags.length);
  const { verdict, label: verdictLabel, explanation: verdictExplanation } = getVerdict(
    priceCheck.verdict,
    riskScore
  );
  const sellerQuestions = buildSellerQuestions(input);
  const negotiationScript = buildNegotiationScript(
    input,
    priceCheck.suggestedOffer,
    redFlags.length
  );
  const { level: confidence, reason: confidenceReason } = computeConfidence(input);

  const buyerChecklist = [
    "Verify ownership documents before any payment",
    "Ask for receipts or proof of purchase",
    "Inspect the item in daylight, not at night",
    "Never send a deposit before seeing the item in person",
    "Meet in a safe, public location (a mall, a busy street)",
    "Test every function before paying",
    "Do not feel pressured to decide on the spot",
  ];

  return {
    verdict,
    verdictLabel,
    verdictExplanation,
    sellerTrust,
    marketComparison,
    scamPatterns,
    riskScore,
    riskExplanation,
    priceCheck,
    redFlags,
    sellerQuestions,
    negotiationScript,
    buyerChecklist,
    confidence,
    confidenceReason,
    disclaimer:
      "DealCheck does not have access to real-time market data. Price guidance is based on risk factors in the listing — not a market lookup. Always check OLX Lebanon and Facebook Marketplace for comparable listings before deciding. Never pay without inspecting in person.",
  };
}
