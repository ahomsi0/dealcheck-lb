import { NextRequest, NextResponse } from "next/server";
import { parseListingHTML } from "@/lib/scrapeUtils";

// POST /api/scrape
// Body: { url: string }
// Returns: ScrapedListing — extracted fields from the listing page.
//
// Facebook Marketplace cannot be scraped without a logged-in session.
// We detect Facebook URLs early and return a structured "manual" response
// with copy-paste instructions rather than attempting a fetch that will fail.
//
// TODO: For non-public sites, future options include:
//   1. Anthropic Claude vision API — user shares a screenshot instead of a URL
//   2. A browser extension that extracts data while the user is logged in

const FETCH_TIMEOUT_MS = 10_000;

const BLOCKED_DOMAINS: Record<string, { name: string; reason: string; instructions: string[] }> = {
  "facebook.com": {
    name: "Facebook Marketplace",
    reason: "Facebook requires you to be logged in to view Marketplace listings. Their website actively blocks any automated access.",
    instructions: [
      "Open the listing on Facebook in your browser",
      "Copy the full listing title and paste it into the \"Listing title\" field",
      "Copy the price shown on the listing",
      "Copy the full description text and paste it into the \"Listing text\" field",
      "Add any extra context the seller sent you in \"Seller notes\"",
    ],
  },
  "fb.com": {
    name: "Facebook Marketplace",
    reason: "Facebook requires you to be logged in to view Marketplace listings.",
    instructions: [
      "Open the listing on Facebook in your browser",
      "Copy the title, price, and description manually into the fields below",
    ],
  },
  "instagram.com": {
    name: "Instagram",
    reason: "Instagram requires login to view posts.",
    instructions: [
      "Open the post on Instagram",
      "Copy the caption and any price/details mentioned",
      "Paste into the listing text field below",
    ],
  },
};

function getBlockedDomain(url: URL): (typeof BLOCKED_DOMAINS)[string] | undefined {
  const host = url.hostname.replace(/^www\./, "");
  for (const [domain, info] of Object.entries(BLOCKED_DOMAINS)) {
    if (host === domain || host.endsWith("." + domain)) return info;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL — check the link and try again." }, { status: 400 });
    }

    // ── Blocked domains: skip the fetch, return instructions immediately ──
    const blocked = getBlockedDomain(parsedUrl);
    if (blocked) {
      return NextResponse.json(
        {
          source: blocked.name,
          fieldsFound: [],
          blocked: true,
          blockedReason: blocked.reason,
          blockedInstructions: blocked.instructions,
        },
        { status: 200 }
      );
    }

    // ── Fetch the listing page ─────────────────────────────────────────────
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `The listing page returned an error (${res.status}). It may be expired, private, or removed.` },
          { status: 422 }
        );
      }

      html = await res.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("abort") || msg.includes("timeout")) {
        return NextResponse.json(
          { error: "The site took too long to respond. Paste the listing text manually instead." },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: "Could not reach that URL. Check the link and try again." },
        { status: 422 }
      );
    } finally {
      clearTimeout(timer);
    }

    const result = parseListingHTML(html, parsedUrl.toString());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
