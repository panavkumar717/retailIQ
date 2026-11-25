import { NextRequest, NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { error: "Speech transcript is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        configured: false,
        message:
          "GEMINI_API_KEY is not configured in .env.local. Please add GEMINI_API_KEY for automatic AI voice extraction, or fill in the product fields manually below.",
        extracted: null,
      });
    }

    const prompt = `You are a retail inventory assistant for an Indian shopkeeper.
Extract structured product stock entry details from the following spoken text (language: ${language || "en-IN"}).
IMPORTANT: Never guess or invent missing values. If a field is not explicitly mentioned, return null for that field.
Return ONLY valid JSON matching this schema:
{
  "productName": string | null,
  "brand": string | null,
  "category": string | null,
  "quantity": number | null,
  "unit": string | null,
  "purchasePrice": number | null,
  "sellingPrice": number | null,
  "mrp": number | null,
  "expiryDate": string | null (YYYY-MM-DD format if mentioned, else null)
}

Spoken text: "${transcript.trim()}"`;

    const result = await callGeminiJson(apiKey, [{ text: prompt }], 0.1);
    if (!result.ok) {
      return NextResponse.json(
        { configured: true, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      configured: true,
      extracted: result.data,
      model: result.model,
    });
  } catch (error) {
    console.error("POST /api/voice/parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse voice entry" },
      { status: 500 }
    );
  }
}
