import { NextRequest, NextResponse } from "next/server";
import { getListingRecords, saveListingRecord } from "@/lib/listingStore";
import type { DealAnalysis, ListingInput } from "@/lib/types";

export async function GET() {
  try {
    const records = await getListingRecords();
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Failed to load saved listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      input?: ListingInput;
      analysis?: DealAnalysis;
    };

    if (!body.input || !body.analysis) {
      return NextResponse.json({ error: "Missing input or analysis" }, { status: 400 });
    }

    const record = await saveListingRecord(body.input, body.analysis);
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save listing" }, { status: 500 });
  }
}
