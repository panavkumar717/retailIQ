import { NextRequest, NextResponse } from "next/server";
import { getEnvironmentStatus, readDatabase, writeDatabase } from "@/lib/store";
import { Campaign } from "@/types/retail";

export async function GET() {
  try {
    const db = readDatabase();
    const env = getEnvironmentStatus();
    return NextResponse.json({
      campaigns: db.campaigns,
      shop: db.shop,
      socialIntegrations: env.socialIntegrations,
      geminiConfigured: env.geminiConfigured,
    });
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json(
      { error: "Failed to load campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.festival || !Array.isArray(body.products)) {
      return NextResponse.json(
        { error: "Campaign title, festival, and products are required" },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const campaign: Campaign = {
      id: `camp_${Date.now()}`,
      title: String(body.title).trim(),
      festival: String(body.festival).trim(),
      message: String(body.message || "").trim(),
      startDate: String(body.startDate || new Date().toISOString().slice(0, 10)),
      endDate: String(body.endDate || new Date().toISOString().slice(0, 10)),
      backgroundUrl: body.backgroundUrl || undefined,
      products: body.products,
      status: body.status || "active",
      createdAt: new Date().toISOString(),
    };

    db.campaigns.unshift(campaign);
    writeDatabase(db);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions error:", error);
    return NextResponse.json(
      { error: "Failed to save campaign" },
      { status: 500 }
    );
  }
}
