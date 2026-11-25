import { NextResponse } from "next/server";
import {
  computeDashboardAndAnalytics,
  computeSmartSuggestions,
  daysUntilExpiry,
  enrichProducts,
} from "@/lib/retail-logic";
import { getEnvironmentStatus, readDatabase } from "@/lib/store";

export async function GET() {
  try {
    const db = readDatabase();
    const { summary, analytics } = computeDashboardAndAnalytics(db);
    const suggestions = computeSmartSuggestions(db);
    const enriched = enrichProducts(
      db.products.filter((p) => !p.isArchived),
      db.batches
    );

    const expiryAlerts = db.batches
      .filter((b) => b.quantity > 0 && daysUntilExpiry(b.expiryDate) <= 30)
      .map((b) => {
        const prod = db.products.find((p) => p.id === b.productId && !p.isArchived);
        if (!prod) return null;
        const daysRemaining = daysUntilExpiry(b.expiryDate);
        return {
          batchId: b.id,
          productId: prod.id,
          productName: prod.name,
          brand: prod.brand,
          category: prod.category,
          unit: prod.unit,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
          daysRemaining,
          purchasePrice: b.purchasePrice,
          sellingPrice: b.sellingPrice,
          valueAtRisk: Number((b.purchasePrice * b.quantity).toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysRemaining - b!.daysRemaining);

    return NextResponse.json({
      shop: db.shop,
      summary,
      analytics,
      suggestions: suggestions.slice(0, 5),
      expiryAlerts,
      recentMovements: db.movements.slice(0, 8),
      recentSales: db.sales.slice(0, 5),
      lowStockProducts: enriched.filter(
        (p) => p.status === "low_stock" || p.status === "out_of_stock"
      ),
      environment: getEnvironmentStatus(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
