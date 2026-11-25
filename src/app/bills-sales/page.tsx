"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import {
  BillLineItem,
  ProductWithBatches,
  Sale,
  UploadedBill,
} from "@/types/retail";

export default function BillsSalesPage() {
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bills, setBills] = useState<UploadedBill[]>([]);
  const [activeBill, setActiveBill] = useState<UploadedBill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);

  // Manual Counter Sale state
  const [manualItems, setManualItems] = useState<
    Array<{ productId: string; quantity: number }>
  >([{ productId: "", quantity: 1 }]);
  const [recordingSale, setRecordingSale] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [prodRes, salesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
      ]);
      const prodJson = await prodRes.json();
      const salesJson = await salesRes.json();
      setProducts(prodJson.products || []);
      setSales(salesJson.sales || []);
      setBills(salesJson.bills || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.split(",")[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/bills/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64Data,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: json.error || "Failed to upload bill." });
        return;
      }

      setActiveBill(json.bill);
      if (!json.configured && json.message) {
        setNotice({ type: "info", text: json.message });
      } else {
        setNotice({
          type: "success",
          text: `Bill "${file.name}" scanned. Please verify matched products before deducting stock.`,
        });
      }
      await loadData();
    } catch {
      setNotice({ type: "error", text: "Error reading bill file." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addBillRow = () => {
    if (!activeBill) return;
    const newItem: BillLineItem = {
      id: `bi_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      rawName: "Manual item",
      matchedProductId: null,
      matchedProductName: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      confidence: "medium",
    };
    setActiveBill({ ...activeBill, items: [...activeBill.items, newItem] });
  };

  const updateBillRow = (id: string, patch: Partial<BillLineItem>) => {
    if (!activeBill) return;
    setActiveBill({
      ...activeBill,
      items: activeBill.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.matchedProductId) {
          const prod = products.find((p) => p.id === patch.matchedProductId);
          if (prod) {
            updated.matchedProductName = prod.name;
            if (!updated.unitPrice && prod.batches[0]) {
              updated.unitPrice = prod.batches[0].sellingPrice;
            }
          }
        }
        updated.lineTotal = Number(
          (updated.quantity * updated.unitPrice).toFixed(2)
        );
        return updated;
      }),
    });
  };

  const removeBillRow = (id: string) => {
    if (!activeBill) return;
    setActiveBill({
      ...activeBill,
      items: activeBill.items.filter((item) => item.id !== id),
    });
  };

  const handleConfirmBill = async () => {
    if (!activeBill) return;
    setConfirming(true);
    setNotice(null);
    try {
      const res = await fetch("/api/bills/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: activeBill.id,
          items: activeBill.items,
          paymentMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: json.error || "Could not confirm bill." });
        return;
      }
      setNotice({
        type: "success",
        text: `Bill confirmed! Stock deducted (earliest-expiring batches first) and sale of ₹${json.sale.totalAmount} recorded.`,
      });
      setActiveBill(null);
      await loadData();
    } catch {
      setNotice({ type: "error", text: "Network error confirming bill." });
    } finally {
      setConfirming(false);
    }
  };

  const handleRecordManualSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = manualItems.filter((i) => i.productId && i.quantity > 0);
    if (validLines.length === 0) return;

    setRecordingSale(true);
    setNotice(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: validLines,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: json.error || "Failed to record sale" });
        return;
      }
      setNotice({
        type: "success",
        text: `Sale recorded (₹${json.sale.totalAmount}) and inventory updated.`,
      });
      setManualItems([{ productId: "", quantity: 1 }]);
      await loadData();
    } catch {
      setNotice({ type: "error", text: "Network error recording sale." });
    } finally {
      setRecordingSale(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
          Bills & Sales
        </h1>
        <p className="text-sm text-ink-secondary">
          Scan customer bills to automatically deduct sold stock, or record counter sales directly.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            notice.type === "error"
              ? "bg-status-danger-bg border-status-danger/25 text-status-danger"
              : notice.type === "success"
              ? "bg-status-success-bg border-status-success/25 text-status-success"
              : "bg-status-warning-bg border-status-warning/25 text-status-warning"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Upload & Confirmation */}
        <div className="retail-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
              <Receipt className="w-4 h-4 text-accent-olive" />
              <span>Scan or Upload Bill</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="retail-btn-secondary cursor-pointer">
              <Camera className="w-4 h-4 text-accent-olive" />
              <span>{uploading ? "Processing..." : "Take Bill Photo"}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <label className="retail-btn-primary cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Upload Image / PDF"}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {activeBill && (
            <div className="p-4 rounded-xl bg-bg-main border border-border-warm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-primary">
                    {activeBill.fileName}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    Verify items and product matches before deducting stock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBillRow}
                  className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              {activeBill.items.length === 0 ? (
                <p className="text-xs text-ink-secondary py-2">
                  No items extracted yet. Click &ldquo;Add Row&rdquo; to enter sold items from this bill.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {activeBill.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-white border border-border-warm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink-secondary">
                          Bill text: {item.rawName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBillRow(item.id)}
                          className="text-status-danger hover:opacity-80"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <select
                          value={item.matchedProductId || ""}
                          onChange={(e) =>
                            updateBillRow(item.id, {
                              matchedProductId: e.target.value || null,
                            })
                          }
                          className="retail-input sm:col-span-2 py-2 text-xs"
                        >
                          <option value="">-- Select Inventory Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.totalQuantity} {p.unit} left)
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateBillRow(item.id, {
                              quantity: Number(e.target.value),
                            })
                          }
                          placeholder="Qty"
                          className="retail-input py-2 text-xs"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateBillRow(item.id, {
                              unitPrice: Number(e.target.value),
                            })
                          }
                          placeholder="Price ₹"
                          className="retail-input py-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "Cash" | "UPI" | "Card")
                  }
                  className="retail-input sm:w-36 py-2 text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
                <button
                  type="button"
                  onClick={handleConfirmBill}
                  disabled={confirming || activeBill.items.length === 0}
                  className="retail-btn-primary"
                >
                  {confirming ? "Confirming..." : "Confirm & Deduct Stock"}
                </button>
              </div>
            </div>
          )}

          {/* Pending Bills */}
          {bills.filter((b) => b.status === "pending").length > 0 && !activeBill && (
            <div className="pt-2 border-t border-border-warm">
              <p className="text-xs font-medium text-ink-secondary mb-2">
                Pending Bills
              </p>
              <div className="space-y-2">
                {bills
                  .filter((b) => b.status === "pending")
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between text-xs"
                    >
                      <span>{b.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setActiveBill(b)}
                        className="text-accent-olive font-medium hover:underline"
                      >
                        Review & Confirm
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Counter Sale */}
        <div className="retail-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-accent-olive" />
            <span>Record Counter Sale</span>
          </h2>
          <form onSubmit={handleRecordManualSale} className="space-y-3">
            {manualItems.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  required
                  value={line.productId}
                  onChange={(e) => {
                    const copy = [...manualItems];
                    copy[idx].productId = e.target.value;
                    setManualItems(copy);
                  }}
                  className="retail-input flex-1"
                >
                  <option value="">Select product...</option>
                  {products
                    .filter((p) => p.totalQuantity > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalQuantity} {p.unit} · ₹
                        {p.batches[0]?.sellingPrice ?? 0})
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min={1}
                  required
                  value={line.quantity}
                  onChange={(e) => {
                    const copy = [...manualItems];
                    copy[idx].quantity = Number(e.target.value);
                    setManualItems(copy);
                  }}
                  className="retail-input w-24"
                />
                {manualItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setManualItems(manualItems.filter((_, i) => i !== idx))
                    }
                    className="p-2 text-status-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setManualItems([...manualItems, { productId: "", quantity: 1 }])
                }
                className="retail-btn-secondary py-2 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "Cash" | "UPI" | "Card")
                  }
                  className="retail-input w-28 py-2 text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
                <button
                  type="submit"
                  disabled={recordingSale}
                  className="retail-btn-primary"
                >
                  {recordingSale ? "Saving..." : "Complete Sale"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sales History */}
      <div className="retail-card p-5">
        <h2 className="text-base font-semibold text-ink-primary mb-3">
          Sales History
        </h2>
        {sales.length === 0 ? (
          <p className="text-xs text-ink-secondary">No sales recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 rounded-lg bg-bg-main border border-border-warm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-ink-primary">
                    {sale.items
                      .map((i) => `${i.productName} × ${i.quantity}`)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {new Date(sale.saleDate).toLocaleString()} · {sale.paymentMethod} ·{" "}
                    {sale.source === "bill_scan" ? "Bill Scan" : "Counter Sale"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-ink-primary">
                    ₹{sale.totalAmount}
                  </p>
                  {sale.totalDiscount > 0 && (
                    <p className="text-xs text-status-success">
                      Saved ₹{sale.totalDiscount}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
