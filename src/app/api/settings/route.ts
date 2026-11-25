import { NextRequest, NextResponse } from "next/server";
import {
  getEnvironmentStatus,
  readDatabase,
  resetDatabase,
  writeDatabase,
} from "@/lib/store";

export async function GET() {
  const db = readDatabase();
  return NextResponse.json({
    shop: db.shop,
    environment: getEnvironmentStatus(),
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const db = readDatabase();

    db.shop = {
      ...db.shop,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : db.shop.name,
      ownerName:
        typeof body.ownerName === "string" ? body.ownerName.trim() : db.shop.ownerName,
      businessType:
        typeof body.businessType === "string"
          ? body.businessType.trim()
          : db.shop.businessType,
      phone: typeof body.phone === "string" ? body.phone.trim() : db.shop.phone,
      address: typeof body.address === "string" ? body.address.trim() : db.shop.address,
      gstNumber:
        typeof body.gstNumber === "string" ? body.gstNumber.trim() : db.shop.gstNumber,
    };

    writeDatabase(db);
    return NextResponse.json({ shop: db.shop });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.action === "reset_demo") {
    const db = resetDatabase();
    return NextResponse.json({ reset: true, shop: db.shop });
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
