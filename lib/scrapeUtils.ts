import type { Category, Currency } from "./types";

export interface ScrapedListing {
  title?: string;
  price?: number;
  currency?: Currency;
  location?: string;
  description?: string;
  category?: Category;
  sellerVerified?: boolean;
  sellerType?: "individual" | "agency";
  source: string;
  fieldsFound: string[];
  warning?: string;
}

// ─── HTML entity decode ────────────────────────────────────────────────────

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ─── Meta tag extraction ───────────────────────────────────────────────────

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']{1,2000})["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']{1,2000})["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']{1,2000})["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']{1,2000})["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHTMLEntities(m[1].trim());
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeHTMLEntities(m[1].trim()) : undefined;
}

// ─── Structured data extraction from inline scripts ───────────────────────

function extractNextData(html: string): Record<string, unknown> | undefined {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return undefined;
  try {
    return JSON.parse(m[1]);
  } catch {
    return undefined;
  }
}

/**
 * Many SPAs inject listing data via window assignments in inline <script> tags.
 * We try common patterns used by Bayut/OLX, Dubizzle, and similar platforms.
 * Returns the first one that parses and has meaningful content.
 */
function extractWindowState(html: string): Record<string, unknown> | undefined {
  const patterns = [
    // Common SPA patterns
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.__STORE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.__APP_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.initialData\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.state\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    // Bayut/OLX specific - they sometimes use initialState
    /window\.initialState\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.__STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      try {
        const parsed = JSON.parse(m[1]);
        if (parsed && typeof parsed === "object") return parsed;
      } catch { /* skip */ }
    }
  }
  return undefined;
}

/**
 * Walk any nested object/array to find ALL string values for a given key.
 * Returns the longest one — useful for finding the real description.
 */
function deepFindAll(obj: unknown, key: string, results: string[] = []): string[] {
  if (!obj || typeof obj !== "object") return results;
  if (Array.isArray(obj)) {
    for (const item of obj) deepFindAll(item, key, results);
  } else {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === key && typeof v === "string" && v.length > 0) {
        results.push(v);
      } else {
        deepFindAll(v, key, results);
      }
    }
  }
  return results;
}

function deepFindLongest(obj: unknown, key: string): string | undefined {
  const all = deepFindAll(obj, key);
  if (!all.length) return undefined;
  return all.reduce((a, b) => (b.length > a.length ? b : a));
}

function walkPath(obj: unknown, path: string[]): unknown {
  let node = obj;
  for (const key of path) {
    if (node && typeof node === "object" && key in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[key];
    } else return undefined;
  }
  return node;
}

// ─── JSON-LD extraction ────────────────────────────────────────────────────

function extractAllJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch { /* skip malformed */ }
  }
  return results;
}

// ─── OLX-specific full description extraction ──────────────────────────────

/**
 * OLX Lebanon uses Next.js. The full ad description lives in __NEXT_DATA__
 * under various paths depending on page type. We try common paths first,
 * then fall back to the deepest "description" string found anywhere in the tree.
 */
function extractOlxDescription(nextData: Record<string, unknown>): string | undefined {
  // Common __NEXT_DATA__ paths used by OLX:
  const paths = [
    ["ad", "data", "description"],
    ["ad", "data", "rawDescription"],
    ["props", "pageProps", "ad", "description"],
    ["props", "pageProps", "adData", "ad", "description"],
    ["props", "pageProps", "listing", "description"],
    ["props", "pageProps", "data", "ad", "description"],
    ["props", "pageProps", "initialState", "ad", "description"],
  ];

  for (const path of paths) {
    let node: unknown = nextData;
    for (const key of path) {
      if (node && typeof node === "object" && key in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[key];
      } else {
        node = undefined;
        break;
      }
    }
    if (typeof node === "string" && node.length > 20) return node;
  }

  // Fall back: find the longest "description" string anywhere in the tree
  return deepFindLongest(nextData, "description");
}

function extractOlxPrice(nextData: Record<string, unknown>): { price?: number; currency?: Currency } {
  // OLX price paths
  const pricePaths = [
    ["ad", "data", "price"],
    ["ad", "data", "extraFields", "price"],
    ["props", "pageProps", "ad", "price", "value"],
    ["props", "pageProps", "adData", "ad", "price", "value"],
    ["props", "pageProps", "listing", "price"],
  ];
  const currencyPaths = [
    ["ad", "data", "currency"],
    ["ad", "data", "price", "currency"],
    ["props", "pageProps", "ad", "price", "currency"],
    ["props", "pageProps", "adData", "ad", "price", "currency"],
  ];

  for (const path of pricePaths) {
    const v = walkPath(nextData, path);
    if (v !== undefined && v !== null) {
      const n = parseFloat(String(v));
      if (!isNaN(n) && n > 0) {
        let currency: Currency = "USD";
        for (const cp of currencyPaths) {
          const c = walkPath(nextData, cp);
          if (typeof c === "string" && c.toUpperCase() === "LBP") {
            currency = "LBP";
            break;
          }
        }
        return { price: Math.round(n), currency };
      }
    }
  }

  // Try deepFind for any price-like number
  const priceStr = deepFindLongest(nextData, "price");
  if (priceStr) {
    const n = parseFloat(priceStr.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) return { price: Math.round(n), currency: "USD" };
  }

  return {};
}

function extractOlxSellerInfo(nextData: Record<string, unknown>): {
  sellerVerified?: boolean;
  sellerType?: "individual" | "agency";
} {
  const verifiedPaths = [
    ["ad", "data", "isSellerVerified"],
    ["ad", "data", "extraFields", "seller_verified"],
  ];

  const sellerTypePaths = [
    ["ad", "data", "extraFields", "seller_type"],
    ["ad", "data", "sellerType"],
  ];

  let sellerVerified: boolean | undefined;
  for (const path of verifiedPaths) {
    const v = walkPath(nextData, path);
    if (typeof v === "boolean") {
      sellerVerified = v;
      break;
    }
    if (typeof v === "string") {
      const normalized = v.toLowerCase().trim();
      if (["yes", "true", "1", "verified"].includes(normalized)) {
        sellerVerified = true;
        break;
      }
      if (["no", "false", "0", "unverified"].includes(normalized)) {
        sellerVerified = false;
        break;
      }
    }
  }

  let sellerType: "individual" | "agency" | undefined;
  for (const path of sellerTypePaths) {
    const v = walkPath(nextData, path);
    if (typeof v !== "string" && typeof v !== "number") continue;
    const normalized = String(v).toLowerCase().trim();
    if (["1", "individual", "private"].includes(normalized)) {
      sellerType = "individual";
      break;
    }
    if (["2", "agency", "company", "dealer"].includes(normalized)) {
      sellerType = "agency";
      break;
    }
  }

  return { sellerVerified, sellerType };
}

function extractOlxLocation(nextData: Record<string, unknown>): string | undefined {
  // OLX window.state.ad.data.location is an ordered location tree.
  const adLocation = (nextData as { ad?: { data?: { location?: unknown } } })?.ad?.data?.location;
  if (Array.isArray(adLocation) && adLocation.length > 0) {
    const names = adLocation
      .map((item) =>
        item && typeof item === "object" && "name" in item
          ? (item as { name?: unknown }).name
          : undefined
      )
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0);

    if (names.length > 0) return names.slice(1).join(", ") || names[0];
  }

  // Try structured location fields
  const cityNames = deepFindAll(nextData, "city");
  const regionNames = deepFindAll(nextData, "region");
  const areaNames = deepFindAll(nextData, "area");
  const locationNames = deepFindAll(nextData, "location");

  for (const candidates of [cityNames, areaNames, regionNames, locationNames]) {
    const short = candidates.find((s) => s.length > 1 && s.length < 60 && !s.startsWith("http"));
    if (short) return short;
  }

  return undefined;
}

// ─── Price extraction from plain text ─────────────────────────────────────

export function extractPrice(text: string): { price?: number; currency?: Currency } {
  const clean = text.replace(/,/g, "");

  const usdPatterns = [
    /\$\s*(\d{3,8})(?:\.\d{1,2})?/,
    /(\d{3,8})\s*(?:USD|usd|dollars?)/i,
    /USD\s*(\d{3,8})/i,
  ];
  for (const re of usdPatterns) {
    const m = clean.match(re);
    if (m) {
      const n = parseInt(m[1]);
      if (n >= 100 && n <= 5_000_000) return { price: n, currency: "USD" };
    }
  }

  const lbpPatterns = [
    /(\d[\d,]*)\s*(?:lbp|l\.l|لل|ل\.ل|ليرة|lirat)/i,
    /(?:lbp|l\.l)\s*(\d[\d,]*)/i,
    /(\d{7,12})\b/,
  ];
  for (const re of lbpPatterns) {
    const m = clean.match(re);
    if (m) {
      const raw = m[1].replace(/,/g, "");
      const n = parseInt(raw);
      if (n >= 500_000 && n <= 500_000_000_000) return { price: n, currency: "LBP" };
    }
  }

  return {};
}

// ─── Category detection ────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  car: [
    "toyota", "honda", "nissan", "mercedes", "bmw", "kia", "hyundai",
    "suzuki", "mazda", "ford", "volkswagen", "audi", "lexus", "peugeot",
    "renault", "mitsubishi", "chevrolet", "jeep", "subaru", "corolla",
    "civic", "camry", "accent", "yaris", "clio", "sedan", "suv", "pickup",
    "hatchback", "4x4", "سيارة", "car for sale",
  ],
  motorcycle: [
    "motorcycle", "motorbike", "scooter", "vespa", "yamaha moto",
    "kawasaki", "ducati", "ktm", "moto", "دراجة نارية",
  ],
  laptop: [
    "laptop", "macbook", "notebook", "lenovo", "thinkpad", "dell xps",
    "asus zenbook", "hp spectre", "surface pro", "chromebook",
  ],
  phone: [
    "iphone", "samsung galaxy", "google pixel", "huawei", "oneplus",
    "xiaomi", "oppo", "phone", "mobile phone", "smartphone", "هاتف",
  ],
  "office-chair": [
    "office chair", "herman miller", "steelcase", "secretlab", "haworth",
    "ergohuman", "gaming chair", "ergonomic chair", "كرسي مكتب",
  ],
  electronics: [
    "tv", "television", "smart tv", "camera", "dslr", "speaker",
    "headphones", "airpods", "monitor", "projector", "playstation",
    "xbox", "nintendo", "drone", "gopro",
  ],
  appliance: [
    "fridge", "refrigerator", "washing machine", "washer", "dryer",
    "air conditioner", "ac unit", "dishwasher", "microwave", "oven",
    "vacuum", "ثلاجة", "مكيف",
  ],
  other: [],
};

function detectCategory(title: string, url: string, text: string): Category | undefined {
  const haystack = `${title} ${url} ${text}`.toLowerCase();
  let best: { cat: Category; score: number } | undefined;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (cat === "other") continue;
    const score = keywords.filter((k) => haystack.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { cat, score };
  }
  return best?.cat;
}

// ─── Location extraction ───────────────────────────────────────────────────

const LEBANESE_AREAS = [
  "beirut", "jounieh", "tripoli", "sidon", "saida", "tyre", "sour",
  "batroun", "byblos", "jbeil", "zalka", "antelias", "dbayeh", "jdeideh",
  "dekwaneh", "sin el fil", "bourj hammoud", "ashrafieh", "hamra", "verdun",
  "ras beirut", "baabda", "metn", "kesrwan", "chouf", "aley", "zahle",
  "baalbeck", "nabatieh", "bint jbeil",
];

function extractLocation(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const area of LEBANESE_AREAS) {
    if (lower.includes(area)) {
      return area.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return undefined;
}

// ─── Platform detection ────────────────────────────────────────────────────

function detectSource(url: string): string {
  if (url.includes("facebook.com") || url.includes("fb.com")) return "Facebook";
  if (url.includes("olx.com.lb") || url.includes("olx.lb")) return "OLX Lebanon";
  if (url.includes("dubizzle.com")) return "Dubizzle";
  if (url.includes("opensooq.com")) return "OpenSooq";
  return "Listing URL";
}

// ─── Main parse function ───────────────────────────────────────────────────

export function parseListingHTML(html: string, url: string): ScrapedListing {
  const source = detectSource(url);
  const fieldsFound: string[] = [];
  const result: ScrapedListing = { source, fieldsFound };
  let descriptionSource: "structured" | "jsonld" | "meta" | undefined;

  // ── Try __NEXT_DATA__ first (Next.js apps) ──
  const nextData = extractNextData(html);

  // ── Try window state (SPAs like OLX Lebanon / Bayut) ──
  const windowState = extractWindowState(html);
  const structuredCandidates = [nextData, windowState].filter(Boolean) as Record<string, unknown>[];

  for (const structuredData of structuredCandidates) {
    // Description — prefer the longest candidate from structured data
    const desc = extractOlxDescription(structuredData);
    if (desc && desc.length > 20) {
      const cleanDesc = desc.trim();
      if (!result.description || cleanDesc.length > result.description.length) {
        result.description = cleanDesc;
        descriptionSource = "structured";
      }
      if (!fieldsFound.includes("description")) fieldsFound.push("description");
    }

    // Price from structured data
    if (!result.price) {
      const { price, currency } = extractOlxPrice(structuredData);
      if (price) {
        result.price = price;
        result.currency = currency ?? "USD";
        fieldsFound.push("price", "currency");
      }
    }

    // Location from structured data
    if (!result.location) {
      const structuredLocation = extractOlxLocation(structuredData);
      if (structuredLocation) {
        result.location = structuredLocation;
        fieldsFound.push("location");
      }
    }

    // Seller trust info from structured data
    const seller = extractOlxSellerInfo(structuredData);
    if (result.sellerVerified === undefined && seller.sellerVerified !== undefined) {
      result.sellerVerified = seller.sellerVerified;
      fieldsFound.push("sellerVerified");
    }
    if (!result.sellerType && seller.sellerType) {
      result.sellerType = seller.sellerType;
      fieldsFound.push("sellerType");
    }
  }

  // ── Try JSON-LD (product schema, etc.) ──
  const jsonLds = extractAllJsonLd(html);
  const jsonLd = jsonLds.find((j) => j.name || j.description || j.offers) ?? jsonLds[0];

  // ── Title — JSON-LD → og:title → <title> ──
  const rawTitle =
    (typeof jsonLd?.name === "string" ? jsonLd.name : undefined) ||
    extractTitle(html);
  if (rawTitle) {
    result.title = rawTitle
      .replace(/\s*[\|–\-]\s*(olx|dubizzle|facebook|opensooq|kijiji).*/i, "")
      .trim();
    if (result.title) fieldsFound.push("title");
  }

  // ── Description fallback: JSON-LD → og:description ──
  if (!result.description) {
    const jsonLdDesc = typeof jsonLd?.description === "string" ? jsonLd.description : undefined;
    const ogDesc = extractMeta(html, "og:description");

    // Prefer whichever is longer — og:description is usually truncated ~200 chars
    const candidates = [jsonLdDesc, ogDesc].filter(Boolean) as string[];
    const best = candidates.reduce<string | undefined>(
      (a, b) => (!a || b.length > a.length ? b : a),
      undefined
    );
    if (best && best.length > 20) {
      result.description = best;
      descriptionSource = best === jsonLdDesc ? "jsonld" : "meta";
      fieldsFound.push("description");
    }
  }

  // ── Price fallback: JSON-LD offers → plain text scan ──
  if (!result.price) {
    if (jsonLd?.offers) {
      const offers = jsonLd.offers as Record<string, unknown>;
      const priceProp = offers.price ?? offers.lowPrice;
      if (priceProp) {
        const n = parseFloat(String(priceProp));
        const cur = String(offers.priceCurrency ?? "USD").toUpperCase();
        if (!isNaN(n) && n > 0) {
          result.price = Math.round(n);
          result.currency = cur === "LBP" ? "LBP" : "USD";
          if (!fieldsFound.includes("price")) fieldsFound.push("price", "currency");
        }
      }
    }

    if (!result.price) {
      const scanText =
        (result.description ?? "") +
        " " +
        (result.title ?? "") +
        " " +
        html.replace(/<[^>]+>/g, " ").slice(0, 8000);
      const { price, currency } = extractPrice(scanText);
      if (price) {
        result.price = price;
        result.currency = currency ?? "USD";
        if (!fieldsFound.includes("price")) fieldsFound.push("price", "currency");
      }
    }
  }

  // ── Location fallback: text scan ──
  if (!result.location) {
    const loc = extractLocation(
      (result.description ?? "") + " " + (result.title ?? "") + " " +
      html.replace(/<[^>]+>/g, " ").slice(0, 4000)
    );
    if (loc) {
      result.location = loc;
      fieldsFound.push("location");
    }
  }

  // ── Category ──
  const category = detectCategory(result.title ?? "", url, result.description ?? "");
  if (category) {
    result.category = category;
    fieldsFound.push("category");
  }

  // ── Warn about known truncation on OLX / Dubizzle ──
  // These platforms only server-render ~200 chars of description for SEO meta tags.
  // The full text is loaded client-side and is never in the raw HTML we fetch.
  const looksOlx = url.includes("olx.com.lb") || url.includes("olx.lb") || url.includes("dubizzle.com");
  const descriptionLength = result.description?.length ?? 0;
  const likelyTruncatedOlxDescription =
    looksOlx &&
    descriptionLength > 0 &&
    descriptionLength <= 260 &&
    (descriptionSource === "meta" || descriptionSource === "jsonld");

  if (likelyTruncatedOlxDescription) {
    result.warning =
      "OLX listings load the full description in your browser — " +
      "only the first ~200 characters are available server-side. " +
      "Open the listing, copy the full description, and paste it into the field below.";
  }

  return result;
}
