import { NextRequest, NextResponse } from "next/server";
import { generateMockAnalysis } from "@/lib/mockAnalysis";
import type { ListingInput } from "@/lib/types";

// POST /api/analyze
// Accepts a ListingInput body and returns a DealAnalysis.
//
// TODO: Replace generateMockAnalysis() with a real AI call, e.g.:
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic();
//   const message = await client.messages.create({
//     model: "claude-opus-4-7",
//     max_tokens: 2048,
//     messages: [{ role: "user", content: buildPrompt(input) }],
//   });
//   const analysis = parseAIResponse(message.content);
//   return NextResponse.json(analysis);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body as ListingInput;

    if (!input.category || !input.askingPrice || !input.currency) {
      return NextResponse.json(
        { error: "Missing required fields: category, askingPrice, currency" },
        { status: 400 }
      );
    }

    // Simulate a short processing delay in development
    if (process.env.NODE_ENV === "development") {
      await new Promise((r) => setTimeout(r, 1200));
    }

    const analysis = generateMockAnalysis(input);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze listing" },
      { status: 500 }
    );
  }
}
