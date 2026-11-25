"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, AlertTriangle, Sparkles } from "lucide-react";

interface ExpiryAlertItem {
  batchId: string;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  unit: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
  purchasePrice: number;
  sellingPrice: number;
  valueAtRisk: number;
}

const WINDOWS = [
  { id: "all", label: "All Alerts" },
  { id: "expired", label: "Expired" },
  { id: "3", label: "Within 3 Days" },
  { id: "7", label: "Within 7 Days" },
  { id: "15", label: "Within 15 Days" },
  { id: "30", label: "Within 30 Days" },
];

export default function ExpiryAlertsPage() {
  const [alerts, setAlerts] = useState<ExpiryAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowFilter, setWindowFilter] = useState("all");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setAlerts(json.expiryAlerts || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = alerts.filter((a) => {
    if (windowFilter === "expired") return a.daysRemaining < 0;
    if (windowFilter === "3") return a.daysRemaining >= 0 && a.daysRemaining <= 3;
    if (windowFilter === "7") return a.daysRemaining >= 0 && a.daysRemaining <= 7;
    if (windowFilter === "15") return a.daysRemaining >= 0 && a.daysRemaining <= 15;
    if (windowFilter === "30") return a.daysRemaining >= 0 && a.daysRemaining <= 30;
    return true;
  });

  const totalRiskValue = filtered.reduce((s, a) => s + a.valueAtRisk, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
            Expiry Alerts
          </h1>
          <p className="text-sm text-ink-secondary">
            Batch-wise expiry tracking so only affected batches are flagged.
          </p>
        </div>
        <Link href="/smart-suggestions" className="retail-btn-primary self-start">
          <Sparkles className="w-4 h-4" />
          <span>View Clearance Discounts</span>
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWindowFilter(w.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              windowFilter === w.id
                ? "bg-accent-olive text-white border-accent-olive"
                : "bg-white text-ink-secondary border-border-warm hover:bg-bg-secondary"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Summary Strip */}
      <div className="retail-card p-4 flex flex-wrap items-center justify-between gap-4 bg-bg-secondary/50">
        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="w-4 h-4 text-status-warning" />
          <span className="font-medium text-ink-primary">
            {filtered.length} batch{filtered.length === 1 ? "" : "es"} in this view
          </span>
        </div>
        <div className="text-sm">
          <span className="text-ink-secondary">Purchase Value at Risk: </span>
          <span className="font-semibold text-status-danger">
            ₹{totalRiskValue.toFixed(2)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          Loading expiry alerts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          No batches found in this expiry window.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block retail-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-secondary/70 border-b border-border-warm text-xs font-medium text-ink-secondary">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Days Remaining</th>
                  <th className="py-3 px-4 text-right">Value at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-sm">
                {filtered.map((item) => (
                  <tr key={item.batchId} className="hover:bg-bg-main/70">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-ink-primary">
                        {item.productName}
                      </p>
                      <p className="text-xs text-ink-secondary">
                        {item.brand || item.category}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-ink-primary">
                      {item.batchNumber}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-ink-primary">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-secondary">
                      {item.expiryDate}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.daysRemaining < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-danger-bg text-status-danger">
                          <AlertTriangle className="w-3 h-3" /> Expired (
                          {Math.abs(item.daysRemaining)}d ago)
                        </span>
                      ) : (
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.daysRemaining <= 3
                              ? "bg-status-danger-bg text-status-danger"
                              : item.daysRemaining <= 7
                              ? "bg-status-warning-bg text-status-warning"
                              : "bg-bg-secondary text-ink-secondary"
                          }`}
                        >
                          {item.daysRemaining} day{item.daysRemaining === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-ink-primary">
                      ₹{item.valueAtRisk.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <div key={item.batchId} className="retail-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">
                      {item.productName}
                    </p>
                    <p className="text-xs text-ink-secondary">
                      Batch {item.batchNumber} · {item.quantity} {item.unit}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.daysRemaining < 0 || item.daysRemaining <= 3
                        ? "bg-status-danger-bg text-status-danger"
                        : "bg-status-warning-bg text-status-warning"
                    }`}
                  >
                    {item.daysRemaining < 0 ? "Expired" : `${item.daysRemaining}d left`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border-warm">
                  <span className="text-ink-secondary">Exp: {item.expiryDate}</span>
                  <span className="font-semibold text-ink-primary">
                    At risk: ₹{item.valueAtRisk.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
