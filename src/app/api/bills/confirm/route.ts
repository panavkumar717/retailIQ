import { NextRequest, NextResponse } from "next/server";
import { deductStockFifo } from "@/lib/retail-logic";
import { readDatabase, writeDatabase } from "@/lib/store";
import { BillLineItem } from "@/types/retail";

export async function POST(request: NextRequest) {
  try {
    const { billId, items, paymentMethod } = (await request.json()) as {
      billId: string;
      items: BillLineItem[];
      paymentMethod?: "Cash" | "UPI" | "Card";
    };

    if (!billId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Bill ID and at least one matched item are required." },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const bill = db.bills.find((b) => b.id === billId);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "confirmed") {
      return NextResponse.json(
        { error: "This bill has already been confirmed and deducted from stock." },
        { status: 409 }
      );
    }

    for (const item of items) {
      if (!item.matchedProductId) {
        return NextResponse.json(
          { error: `Please select a matching inventory product for "${item.rawName}".` },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for "${item.rawName}".` },
          { status: 400 }
        );
      }
    }

    const result = deductStockFifo(
      db,
      items.map((item) => ({
        productId: item.matchedProductId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice > 0 ? item.unitPrice : undefined,
      })),
      {
        source: "bill_scan",
        billId: bill.id,
        paymentMethod: paymentMethod || "Cash",
      }
    );

    bill.items = items;
    bill.status = "confirmed";
    bill.totalAmount = result.sale.totalAmount;

    writeDatabase(db);
    return NextResponse.json({ bill, sale: result.sale });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
