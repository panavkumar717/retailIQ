import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deductStockFifo } from "@/lib/retail-logic";
import { readDatabase, writeDatabase } from "@/lib/store";

const createSaleSchema = z.object({
  paymentMethod: z.enum(["Cash", "UPI", "Card"]).optional().default("Cash"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0).optional(),
      })
    )
    .min(1, "Select at least one product"),
});

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({
      sales: db.sales,
      bills: db.bills,
    });
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json(
      { error: "Failed to load sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid sale payload" },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const result = deductStockFifo(db, parsed.data.items, {
      source: "manual",
      paymentMethod: parsed.data.paymentMethod,
    });

    writeDatabase(db);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record sale";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
