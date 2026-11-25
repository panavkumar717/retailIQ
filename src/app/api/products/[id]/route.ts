import { NextRequest, NextResponse } from "next/server";
import { enrichProducts } from "@/lib/retail-logic";
import { readDatabase, writeDatabase } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDatabase();
  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const [enriched] = enrichProducts([product], db.batches);
  return NextResponse.json({ product: enriched });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = readDatabase();
    const product = db.products.find((p) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) {
      product.name = body.name.trim();
    }
    if (typeof body.brand === "string") {
      product.brand = body.brand.trim();
    }
    if (typeof body.category === "string" && body.category.trim()) {
      product.category = body.category.trim();
    }
    if (typeof body.unit === "string" && body.unit.trim()) {
      product.unit = body.unit.trim();
    }
    if (typeof body.lowStockThreshold === "number") {
      product.lowStockThreshold = Math.max(0, body.lowStockThreshold);
    }
    if (typeof body.barcode === "string") {
      product.barcode = body.barcode.trim();
    }
    if (typeof body.imageUrl === "string") {
      product.imageUrl = body.imageUrl;
    }
    if (typeof body.isArchived === "boolean") {
      product.isArchived = body.isArchived;
    }

    product.updatedAt = new Date().toISOString();
    writeDatabase(db);

    const [enriched] = enrichProducts([product], db.batches);
    return NextResponse.json({ product: enriched });
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
