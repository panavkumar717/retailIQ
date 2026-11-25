import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/gemini";
import { readDatabase, writeDatabase } from "@/lib/store";
import { BillLineItem, UploadedBill } from "@/types/retail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, mimeType, base64Data, manualOnly } = body as {
      fileName: string;
      mimeType: string;
      base64Data: string;
      manualOnly?: boolean;
    };

    if (!fileName || !base64Data) {
      return NextResponse.json(
        { error: "Bill file name and file data are required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Data, "base64");
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const db = readDatabase();
    const duplicate = db.bills.find((b) => b.fileHash === fileHash);
    if (duplicate) {
      return NextResponse.json(
        {
          error: `Duplicate bill detected: "${duplicate.fileName}" was already uploaded on ${new Date(
            duplicate.createdAt
          ).toLocaleDateString()} (status: ${duplicate.status}).`,
          duplicateBillId: duplicate.id,
        },
        { status: 409 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || manualOnly) {
      const pendingBill: UploadedBill = {
        id: `bill_${Date.now()}`,
        fileName,
        fileHash,
        billDate: new Date().toISOString().slice(0, 10),
        totalAmount: 0,
        status: "pending",
        items: [],
        createdAt: new Date().toISOString(),
      };
      db.bills.unshift(pendingBill);
      writeDatabase(db);

      return NextResponse.json({
        configured: Boolean(apiKey),
        bill: pendingBill,
        message: apiKey
          ? "Blank bill created for manual item entry."
          : "GEMINI_API_KEY is not configured in .env.local. Add GEMINI_API_KEY for automatic bill OCR extraction, or add the sold items manually below before confirming.",
      });
    }

    const productCatalog = db.products
      .filter((p) => !p.isArchived)
      .map((p) => ({ id: p.id, name: p.name, brand: p.brand, unit: p.unit }));

    const prompt = `You are a retail bill & invoice extraction assistant.
Inspect the attached bill/receipt image or PDF and extract all sold line items.
Match each item to the closest product in the shop's catalog when confident, or set matchedProductId to null if uncertain. Never guess unclear quantities.
Catalog: ${JSON.stringify(productCatalog)}

Return ONLY valid JSON:
{
  "billDate": "YYYY-MM-DD",
  "totalAmount": number,
  "items": [
    {
      "rawName": string,
      "matchedProductId": string | null,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number,
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

    const geminiResult = await callGeminiJson(
      apiKey,
      [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data,
          },
        },
      ],
      0.1
    );

    if (!geminiResult.ok) {
      return NextResponse.json(
        { error: geminiResult.error },
        { status: geminiResult.status }
      );
    }

    const extracted = geminiResult.data as {
      billDate?: string;
      totalAmount?: number;
      items?: Array<Partial<BillLineItem>>;
    };

    const items: BillLineItem[] = (extracted.items || []).map(
      (item: Partial<BillLineItem>, idx: number) => {
        const matchedProd = db.products.find(
          (p) => p.id === item.matchedProductId && !p.isArchived
        );
        return {
          id: `bi_${Date.now()}_${idx}`,
          rawName: item.rawName || "Unknown item",
          matchedProductId: matchedProd ? matchedProd.id : null,
          matchedProductName: matchedProd ? matchedProd.name : "",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          lineTotal: Number(item.lineTotal) || 0,
          confidence: item.confidence || (matchedProd ? "medium" : "low"),
        };
      }
    );

    const bill: UploadedBill = {
      id: `bill_${Date.now()}`,
      fileName,
      fileHash,
      billDate: extracted.billDate || new Date().toISOString().slice(0, 10),
      totalAmount: Number(extracted.totalAmount) || 0,
      status: "pending",
      items,
      createdAt: new Date().toISOString(),
    };

    db.bills.unshift(bill);
    writeDatabase(db);

    return NextResponse.json({ configured: true, bill });
  } catch (error) {
    console.error("POST /api/bills/scan error:", error);
    return NextResponse.json(
      { error: "Failed to process uploaded bill" },
      { status: 500 }
    );
  }
}
