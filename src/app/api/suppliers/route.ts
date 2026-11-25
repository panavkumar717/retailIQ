import { NextRequest, NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/store";
import { Supplier } from "@/types/retail";

export async function GET() {
  const db = readDatabase();
  return NextResponse.json({ suppliers: db.suppliers });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const supplier: Supplier = {
      id: `sup_${Date.now()}`,
      name: String(body.name).trim(),
      contactPerson: String(body.contactPerson || "").trim(),
      phone: String(body.phone || "").trim(),
      email: String(body.email || "").trim(),
      address: String(body.address || "").trim(),
      categories: Array.isArray(body.categories) ? body.categories : [],
      notes: String(body.notes || "").trim(),
      createdAt: new Date().toISOString(),
    };

    db.suppliers.unshift(supplier);
    writeDatabase(db);

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error("POST /api/suppliers error:", error);
    return NextResponse.json(
      { error: "Failed to add supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Supplier ID required" }, { status: 400 });
  }
  const db = readDatabase();
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  writeDatabase(db);
  return NextResponse.json({ deleted: true });
}
