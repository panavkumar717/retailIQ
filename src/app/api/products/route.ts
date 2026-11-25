import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichProducts } from "@/lib/retail-logic";
import { readDatabase, writeDatabase } from "@/lib/store";
import { InventoryBatch, Product, StockMovement } from "@/types/retail";

const createProductSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  brand: z.string().optional().default(""),
  category: z.string().min(1, "Category is required"),
  unit: z.string().optional().default("packets"),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  imageUrl: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  batchNumber: z.string().optional(),
  supplierId: z.string().optional(),
  quantity: z.number().int().min(0),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  mrp: z.number().min(0),
  manufacturingDate: z.string().optional().default(""),
  expiryDate: z.string().optional().default(""),
  source: z.enum(["IN_QR", "IN_VOICE", "IN_MANUAL"]).optional().default("IN_MANUAL"),
});

export async function GET(request: NextRequest) {
  try {
    const db = readDatabase();
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("archived") === "true";

    const filteredProducts = db.products.filter((p) =>
      includeArchived ? true : !p.isArchived
    );
    const products = enrichProducts(filteredProducts, db.batches);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const db = readDatabase();
    const now = new Date().toISOString();

    let product: Product | undefined;

    if (data.productId) {
      product = db.products.find((p) => p.id === data.productId);
    }
    if (!product) {
      // Check if an active product with same name + brand exists when adding a batch
      product = db.products.find(
        (p) =>
          !p.isArchived &&
          p.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
          (p.brand || "").trim().toLowerCase() === (data.brand || "").trim().toLowerCase()
      );
    }

    if (!product) {
      product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: data.name.trim(),
        brand: data.brand.trim(),
        category: data.category.trim(),
        unit: data.unit.trim() || "packets",
        lowStockThreshold: data.lowStockThreshold,
        imageUrl: data.imageUrl,
        barcode: data.barcode,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      db.products.unshift(product);
    } else {
      product.updatedAt = now;
      if (data.barcode && !product.barcode) {
        product.barcode = data.barcode;
      }
      if (data.imageUrl && !product.imageUrl) {
        product.imageUrl = data.imageUrl;
      }
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const batchNumber =
      data.batchNumber?.trim() ||
      `B-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`;

    const qrCodePayload = JSON.stringify({
      type: "RETAIL_IQ_BATCH",
      batchId,
      productId: product.id,
      batchNumber,
      name: product.name,
    });

    const discountPercent =
      data.mrp > 0 && data.sellingPrice < data.mrp
        ? Number((((data.mrp - data.sellingPrice) / data.mrp) * 100).toFixed(2))
        : 0;

    const batch: InventoryBatch = {
      id: batchId,
      productId: product.id,
      batchNumber,
      supplierId: data.supplierId,
      quantity: data.quantity,
      initialQuantity: data.quantity,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      mrp: data.mrp,
      discountPercent,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
      qrCodePayload,
      createdAt: now,
    };

    db.batches.unshift(batch);

    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      movementType: data.source,
      quantityChange: data.quantity,
      reason:
        data.source === "IN_QR"
          ? `QR intake (${batch.batchNumber})`
          : data.source === "IN_VOICE"
          ? `Voice entry (${batch.batchNumber})`
          : `Manual stock entry (${batch.batchNumber})`,
      createdAt: now,
    };

    db.movements.unshift(movement);
    writeDatabase(db);

    return NextResponse.json({ product, batch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to save product" },
      { status: 500 }
    );
  }
}
