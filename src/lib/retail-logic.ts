import {
  DiscountRecommendation,
  InventoryBatch,
  Product,
  ProductWithBatches,
  RetailDatabase,
  Sale,
  SaleItem,
  StockMovement,
  StockStatus,
} from "@/types/retail";

export function daysUntilExpiry(expiryDate: string): number {
  if (!expiryDate) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function getBatchStatus(batch: InventoryBatch): StockStatus {
  if (batch.quantity <= 0) return "out_of_stock";
  const days = daysUntilExpiry(batch.expiryDate);
  if (days < 0) return "expired";
  if (days <= 15) return "expiring_soon";
  return "in_stock";
}

export function computeProductStatus(
  batches: InventoryBatch[],
  lowStockThreshold: number
): StockStatus {
  const activeBatches = batches.filter((b) => b.quantity > 0);
  const totalQty = activeBatches.reduce((sum, b) => sum + b.quantity, 0);

  if (totalQty === 0) return "out_of_stock";

  const nonExpiredQty = activeBatches
    .filter((b) => daysUntilExpiry(b.expiryDate) >= 0)
    .reduce((sum, b) => sum + b.quantity, 0);

  if (nonExpiredQty === 0) return "expired";

  const hasExpiringSoon = activeBatches.some((b) => {
    const d = daysUntilExpiry(b.expiryDate);
    return d >= 0 && d <= 7;
  });
  if (hasExpiringSoon) return "expiring_soon";

  if (nonExpiredQty <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function enrichProducts(
  products: Product[],
  batches: InventoryBatch[]
): ProductWithBatches[] {
  return products.map((product) => {
    const productBatches = batches
      .filter((b) => b.productId === product.id)
      .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

    const totalQuantity = productBatches.reduce((sum, b) => sum + b.quantity, 0);
    const activeNonExpired = productBatches.filter(
      (b) => b.quantity > 0 && b.expiryDate
    );
    const earliestExpiry =
      activeNonExpired.length > 0 ? activeNonExpired[0].expiryDate : null;

    return {
      ...product,
      batches: productBatches,
      totalQuantity,
      earliestExpiry,
      status: computeProductStatus(productBatches, product.lowStockThreshold),
    };
  });
}

export interface DeductLineRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export function deductStockFifo(
  db: RetailDatabase,
  lines: DeductLineRequest[],
  options: {
    source: "manual" | "bill_scan";
    paymentMethod?: "Cash" | "UPI" | "Card";
    billId?: string;
    saleDate?: string;
  }
): { sale: Sale; movements: StockMovement[] } {
  const saleItems: SaleItem[] = [];
  const movements: StockMovement[] = [];
  let totalAmount = 0;
  let totalDiscount = 0;

  // Validate all requested quantities before mutating
  for (const line of lines) {
    if (line.quantity <= 0) {
      throw new Error("Sale quantity must be greater than zero.");
    }
    const product = db.products.find((p) => p.id === line.productId && !p.isArchived);
    if (!product) {
      throw new Error(`Product not found for id ${line.productId}.`);
    }
    const availableBatches = db.batches.filter(
      (b) => b.productId === line.productId && b.quantity > 0
    );
    const totalAvailable = availableBatches.reduce((s, b) => s + b.quantity, 0);
    if (totalAvailable < line.quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Requested ${line.quantity}, available ${totalAvailable}.`
      );
    }
  }

  const nowIso = options.saleDate || new Date().toISOString();

  for (const line of lines) {
    const product = db.products.find((p) => p.id === line.productId)!;
    // Earliest-expiring suitable batches first (non-expired preferred, then expired if only option)
    const candidateBatches = db.batches
      .filter((b) => b.productId === line.productId && b.quantity > 0)
      .sort((a, b) => {
        const da = daysUntilExpiry(a.expiryDate);
        const dbDays = daysUntilExpiry(b.expiryDate);
        const aExpired = da < 0 ? 1 : 0;
        const bExpired = dbDays < 0 ? 1 : 0;
        if (aExpired !== bExpired) return aExpired - bExpired;
        return da - dbDays;
      });

    let remaining = line.quantity;
    for (const batch of candidateBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      remaining -= take;

      const effectiveUnitPrice =
        typeof line.unitPrice === "number" && line.unitPrice > 0
          ? line.unitPrice
          : batch.sellingPrice;
      const discountPerUnit = Math.max(0, batch.mrp - effectiveUnitPrice);
      const lineTotal = Number((effectiveUnitPrice * take).toFixed(2));
      const lineDiscount = Number((discountPerUnit * take).toFixed(2));

      totalAmount += lineTotal;
      totalDiscount += lineDiscount;

      saleItems.push({
        id: `si_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: product.id,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        quantity: take,
        unitPrice: effectiveUnitPrice,
        purchasePrice: batch.purchasePrice,
        discountAmount: lineDiscount,
        lineTotal,
      });

      movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: product.id,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        movementType: options.source === "bill_scan" ? "OUT_BILL" : "OUT_SALE",
        quantityChange: -take,
        reason:
          options.source === "bill_scan"
            ? `Bill sale deduction (${batch.batchNumber})`
            : `Sale recorded (${batch.batchNumber})`,
        createdAt: nowIso,
      });
    }
  }

  const sale: Sale = {
    id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    billId: options.billId,
    saleDate: nowIso,
    totalAmount: Number(totalAmount.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    paymentMethod: options.paymentMethod || "Cash",
    source: options.source,
    items: saleItems,
  };

  db.sales.unshift(sale);
  db.movements.unshift(...movements);

  return { sale, movements };
}

export function computeSmartSuggestions(
  db: RetailDatabase
): DiscountRecommendation[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const soldByProduct = new Map<string, number>();

  for (const sale of db.sales) {
    if (new Date(sale.saleDate).getTime() >= thirtyDaysAgo) {
      for (const item of sale.items) {
        soldByProduct.set(
          item.productId,
          (soldByProduct.get(item.productId) || 0) + item.quantity
        );
      }
    }
  }

  const recommendations: DiscountRecommendation[] = [];

  for (const batch of db.batches) {
    if (batch.quantity <= 0) continue;
    const product = db.products.find(
      (p) => p.id === batch.productId && !p.isArchived
    );
    if (!product) continue;

    const days = daysUntilExpiry(batch.expiryDate);
    if (days < 0 || days > 30) continue;

    const totalSold30d = soldByProduct.get(product.id) || 0;
    const avgDailySales = Number(Math.max(0.2, totalSold30d / 30).toFixed(2));
    const projectedUnitsSold = avgDailySales * Math.max(1, days);

    // Recommend discount when stock exceeds projected sales before expiry, or expiry <= 15 days
    if (batch.quantity > projectedUnitsSold || days <= 15) {
      let suggestedDiscountPercent = 10;
      if (days <= 2) {
        suggestedDiscountPercent = 25;
      } else if (days <= 5) {
        suggestedDiscountPercent = 20;
      } else if (days <= 10) {
        suggestedDiscountPercent = 15;
      } else if (days <= 20) {
        suggestedDiscountPercent = 10;
      } else {
        suggestedDiscountPercent = 8;
      }

      // Cap discount if margin is tight unless urgent
      const basePrice = batch.mrp > 0 ? batch.mrp : batch.sellingPrice;
      const suggestedSellingPrice = Number(
        (basePrice * (1 - suggestedDiscountPercent / 100)).toFixed(2)
      );
      const belowCostWarning = suggestedSellingPrice < batch.purchasePrice;
      const estimatedRevenue = Number(
        (suggestedSellingPrice * batch.quantity).toFixed(2)
      );
      const potentialLossAvoided = Number(
        (batch.purchasePrice * batch.quantity).toFixed(2)
      );

      let reason = `Expires in ${days} day${days === 1 ? "" : "s"} with ${batch.quantity} ${product.unit} left`;
      if (avgDailySales > 0) {
        reason += ` (avg ${avgDailySales}/day — ${Math.round(projectedUnitsSold)} projected to sell at full price).`;
      }

      recommendations.push({
        id: `rec_${batch.id}`,
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        availableQuantity: batch.quantity,
        expiryDate: batch.expiryDate,
        daysRemaining: days,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice,
        mrp: batch.mrp,
        avgDailySales,
        suggestedDiscountPercent,
        suggestedSellingPrice,
        reason,
        estimatedRevenue,
        potentialLossAvoided,
        status: batch.discountPercent >= suggestedDiscountPercent ? "applied" : "pending",
        belowCostWarning,
      });
    }
  }

  return recommendations.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function computeDashboardAndAnalytics(db: RetailDatabase) {
  const activeProducts = db.products.filter((p) => !p.isArchived);
  const enriched = enrichProducts(activeProducts, db.batches);

  let availableStock = 0;
  let totalStockValue = 0;
  let potentialLossFromExpiry = 0;
  let expiredStockValue = 0;
  let expiredBatchesCount = 0;
  let expiringSoonBatchesCount = 0;
  let lowStockProductsCount = 0;

  const categoryStockMap = new Map<string, { category: string; quantity: number; value: number }>();

  for (const prod of enriched) {
    if (prod.status === "low_stock" || prod.status === "out_of_stock") {
      lowStockProductsCount++;
    }

    for (const batch of prod.batches) {
      if (batch.quantity <= 0) continue;
      const days = daysUntilExpiry(batch.expiryDate);
      const costVal = batch.purchasePrice * batch.quantity;

      if (days < 0) {
        expiredBatchesCount++;
        expiredStockValue += costVal;
      } else {
        availableStock += batch.quantity;
        totalStockValue += costVal;

        if (days <= 15) {
          expiringSoonBatchesCount++;
          potentialLossFromExpiry += costVal;
        }

        const existingCat = categoryStockMap.get(prod.category) || {
          category: prod.category,
          quantity: 0,
          value: 0,
        };
        existingCat.quantity += batch.quantity;
        existingCat.value += costVal;
        categoryStockMap.set(prod.category, existingCat);
      }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let todaysSales = 0;
  let totalRevenue = 0;
  let costOfGoodsSold = 0;
  let totalDiscounts = 0;

  const dailySalesMap = new Map<string, { date: string; revenue: number; profit: number }>();
  const monthlySalesMap = new Map<string, { month: string; revenue: number; profit: number }>();
  const categorySalesMap = new Map<string, { category: string; revenue: number; units: number }>();
  const productVelocityMap = new Map<
    string,
    { productId: string; name: string; unitsSold: number; revenue: number }
  >();

  for (const sale of db.sales) {
    const saleDateKey = sale.saleDate.slice(0, 10);
    const saleMonthKey = sale.saleDate.slice(0, 7);

    if (saleDateKey === todayStr) {
      todaysSales += sale.totalAmount;
    }

    totalRevenue += sale.totalAmount;
    totalDiscounts += sale.totalDiscount;

    let saleCogs = 0;
    for (const item of sale.items) {
      saleCogs += item.purchasePrice * item.quantity;
      const prod = db.products.find((p) => p.id === item.productId);
      const category = prod?.category || "Other";

      const catEntry = categorySalesMap.get(category) || {
        category,
        revenue: 0,
        units: 0,
      };
      catEntry.revenue += item.lineTotal;
      catEntry.units += item.quantity;
      categorySalesMap.set(category, catEntry);

      const velEntry = productVelocityMap.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        unitsSold: 0,
        revenue: 0,
      };
      velEntry.unitsSold += item.quantity;
      velEntry.revenue += item.lineTotal;
      productVelocityMap.set(item.productId, velEntry);
    }

    costOfGoodsSold += saleCogs;
    const saleProfit = sale.totalAmount - saleCogs;

    const dEntry = dailySalesMap.get(saleDateKey) || {
      date: saleDateKey,
      revenue: 0,
      profit: 0,
    };
    dEntry.revenue += sale.totalAmount;
    dEntry.profit += saleProfit;
    dailySalesMap.set(saleDateKey, dEntry);

    const mEntry = monthlySalesMap.get(saleMonthKey) || {
      month: saleMonthKey,
      revenue: 0,
      profit: 0,
    };
    mEntry.revenue += sale.totalAmount;
    mEntry.profit += saleProfit;
    monthlySalesMap.set(saleMonthKey, mEntry);
  }

  const velocityList = Array.from(productVelocityMap.values()).sort(
    (a, b) => b.unitsSold - a.unitsSold
  );

  // Include zero-sale products in slow-moving
  const slowMoving = activeProducts
    .map((p) => {
      const found = productVelocityMap.get(p.id);
      return (
        found || {
          productId: p.id,
          name: p.name,
          unitsSold: 0,
          revenue: 0,
        }
      );
    })
    .sort((a, b) => a.unitsSold - b.unitsSold)
    .slice(0, 5);

  const dailySales = Array.from(dailySalesMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const monthlySales = Array.from(monthlySalesMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  return {
    summary: {
      totalProducts: activeProducts.length,
      availableStock,
      todaysSales: Number(todaysSales.toFixed(2)),
      expiringSoonCount: expiringSoonBatchesCount,
      expiredCount: expiredBatchesCount,
      lowStockCount: lowStockProductsCount,
      totalStockValue: Number(totalStockValue.toFixed(2)),
      potentialLossFromExpiry: Number(potentialLossFromExpiry.toFixed(2)),
    },
    analytics: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      costOfGoodsSold: Number(costOfGoodsSold.toFixed(2)),
      grossProfit: Number((totalRevenue - costOfGoodsSold).toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      expiredStockValue: Number(expiredStockValue.toFixed(2)),
      potentialExpiryLoss: Number(potentialLossFromExpiry.toFixed(2)),
      fastMoving: velocityList.slice(0, 5),
      slowMoving,
      dailySales,
      monthlySales,
      categorySales: Array.from(categorySalesMap.values()),
      categoryStock: Array.from(categoryStockMap.values()),
    },
  };
}
