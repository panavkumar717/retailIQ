import { NextRequest, NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "QR or barcode value is required" }, { status: 400 });
    }

    const trimmed = code.trim();
    const db = readDatabase();

    // 1. Try parsing as Retail IQ JSON QR payload
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.batchId) {
        const batch = db.batches.find((b) => b.id === parsed.batchId);
        const product = batch
          ? db.products.find((p) => p.id === batch.productId)
          : db.products.find((p) => p.id === parsed.productId);

        if (product) {
          return NextResponse.json({
            matched: true,
            matchType: "retail_iq_batch",
            product,
            batch: batch || null,
          });
        }
      }
    } catch {
      // Not JSON — continue to barcode / code lookup
    }

    // 2. Try matching barcode or batchNumber
    const productByBarcode = db.products.find(
      (p) => !p.isArchived && p.barcode && p.barcode === trimmed
    );
    if (productByBarcode) {
      const latestBatch = db.batches.find((b) => b.productId === productByBarcode.id) || null;
      return NextResponse.json({
        matched: true,
        matchType: "barcode",
        product: productByBarcode,
        batch: latestBatch,
      });
    }

    const batchByNumber = db.batches.find(
      (b) => b.batchNumber.toLowerCase() === trimmed.toLowerCase()
    );
    if (batchByNumber) {
      const product = db.products.find((p) => p.id === batchByNumber.productId);
      if (product) {
        return NextResponse.json({
          matched: true,
          matchType: "batch_number",
          product,
          batch: batchByNumber,
        });
      }
    }

    return NextResponse.json({
      matched: false,
      rawCode: trimmed,
      message: "No existing product matched this code. Enter the product details below to add it.",
    });
  } catch (error) {
    console.error("POST /api/qr/lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup scanned code" },
      { status: 500 }
    );
  }
}
