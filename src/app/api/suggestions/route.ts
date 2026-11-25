import { NextRequest, NextResponse } from "next/server";
import { computeSmartSuggestions } from "@/lib/retail-logic";
import { readDatabase, writeDatabase } from "@/lib/store";

export async function GET() {
  try {
    const db = readDatabase();
    const suggestions = computeSmartSuggestions(db);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to compute smart suggestions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { batchId, discountPercent, newSellingPrice, confirmBelowCost } =
      (await request.json()) as {
        batchId: string;
        discountPercent?: number;
        newSellingPrice?: number;
        confirmBelowCost?: boolean;
      };

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const batch = db.batches.find((b) => b.id === batchId);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const basePrice = batch.mrp > 0 ? batch.mrp : batch.sellingPrice;
    let finalPrice = batch.sellingPrice;
    let finalDiscount = 0;

    if (typeof newSellingPrice === "number" && newSellingPrice >= 0) {
      finalPrice = Number(newSellingPrice.toFixed(2));
      finalDiscount =
        basePrice > 0
          ? Number(Math.max(0, ((basePrice - finalPrice) / basePrice) * 100).toFixed(2))
          : 0;
    } else if (typeof discountPercent === "number" && discountPercent >= 0 && discountPercent <= 90) {
      finalDiscount = Number(discountPercent.toFixed(2));
      finalPrice = Number((basePrice * (1 - finalDiscount / 100)).toFixed(2));
    } else {
      return NextResponse.json(
        { error: "Provide a valid discount percentage or selling price." },
        { status: 400 }
      );
    }

    if (finalPrice < batch.purchasePrice && !confirmBelowCost) {
      return NextResponse.json(
        {
          requiresConfirmation: true,
          warning: `Warning: New selling price (₹${finalPrice}) is below your purchase price (₹${batch.purchasePrice}). Confirm to apply anyway.`,
          finalPrice,
          finalDiscount,
        },
        { status: 200 }
      );
    }

    batch.sellingPrice = finalPrice;
    batch.discountPercent = finalDiscount;
    writeDatabase(db);

    return NextResponse.json({ applied: true, batch });
  } catch (error) {
    console.error("POST /api/suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to apply discount" },
      { status: 500 }
    );
  }
}
