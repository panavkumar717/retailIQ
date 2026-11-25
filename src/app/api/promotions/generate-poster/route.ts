import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { festival, styleNote } = (await request.json()) as {
      festival: string;
      styleNote?: string;
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        configured: false,
        backgroundUrl: null,
        message:
          "GEMINI_API_KEY is not configured in .env.local. Using the built-in warm editorial festival template instead. Add GEMINI_API_KEY to generate custom AI backgrounds.",
      });
    }

    const prompt = `Warm, elegant, minimalist festive retail poster background for ${festival} in India. Soft cream and ivory paper texture, subtle muted gold, olive sage, and warm terracotta traditional motifs along the borders only, with a clean spacious bright center area for text overlay. No text, no letters, no numbers, no prices, no watermarks. ${styleNote || ""}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        configured: true,
        backgroundUrl: null,
        error: `Image generation failed (${response.status}): ${errText.slice(0, 180)}`,
      });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.data
    );

    if (!imgPart?.inlineData) {
      return NextResponse.json({
        configured: true,
        backgroundUrl: null,
        error: "Image generation model did not return an image. Using editorial template.",
      });
    }

    const dataUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
    return NextResponse.json({
      configured: true,
      backgroundUrl: dataUrl,
    });
  } catch (error) {
    console.error("POST /api/promotions/generate-poster error:", error);
    return NextResponse.json(
      { error: "Failed to generate poster background" },
      { status: 500 }
    );
  }
}
