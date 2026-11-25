import { NextRequest, NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = readDatabase();
    const batch = db.batches.find((b) => b.id === id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const product = db.products.find((p) => p.id === batch.productId);
    const oldQty = batch.quantity;

    if (typeof body.quantity === "number" && body.quantity >= 0) {
      batch.quantity = Math.floor(body.quantity);
    }
    if (typeof body.purchasePrice === "number" && body.purchasePrice >= 0) {
      batch.purchasePrice = body.purchasePrice;
    }
    if (typeof body.sellingPrice === "number" && body.sellingPrice >= 0) {
      batch.sellingPrice = body.sellingPrice;
    }
    if (typeof body.mrp === "number" && body.mrp >= 0) {
      batch.mrp = body.mrp;
    }
    if (typeof body.discountPercent === "number" && body.discountPercent >= 0) {
      batch.discountPercent = body.discountPercent;
    }
    if (typeof body.expiryDate === "string") {
      batch.expiryDate = body.expiryDate;
    }
    if (typeof body.batchNumber === "string" && body.batchNumber.trim()) {
      batch.batchNumber = body.batchNumber.trim();
    }

    if (batch.quantity !== oldQty && product) {
      db.movements.unshift({
        id: `mov_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        movementType: "ADJUSTMENT",
        quantityChange: batch.quantity - oldQty,
        reason: body.reason || `Manual batch adjustment (${batch.batchNumber})`,
        createdAt: new Date().toISOString(),
      });
    }

    writeDatabase(db);
    return NextResponse.json({ batch });
  } catch (error) {
    console.error("PATCH /api/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}
