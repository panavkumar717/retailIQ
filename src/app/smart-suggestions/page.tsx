"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DiscountRecommendation } from "@/types/retail";

export default function SmartSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<DiscountRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualDiscounts, setManualDiscounts] = useState<Record<string, string>>({});
  const [belowCostPrompt, setBelowCostPrompt] = useState<{
    batchId: string;
    discountPercent: number;
    warning: string;
  } | null>(null);
  const [notice, setNotice] = useState<string>("");

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      const json = await res.json();
      setSuggestions(json.suggestions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const applyDiscount = async (
    batchId: string,
    discountPercent: number,
    confirmBelowCost = false
  ) => {
    setNotice("");
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        discountPercent,
        confirmBelowCost,
      }),
    });
    const json = await res.json();

    if (json.requiresConfirmation) {
      setBelowCostPrompt({
        batchId,
        discountPercent,
        warning: json.warning,
      });
      return;
    }

    if (res.ok && json.applied) {
      setBelowCostPrompt(null);
      setNotice(
        `Discount applied! Batch selling price updated to ₹${json.batch.sellingPrice}.`
      );
      await loadSuggestions();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-olive" />
          <span>Smart Suggestions</span>
        </h1>
        <p className="text-sm text-ink-secondary">
          Clearance discount recommendations based on expiry date, stock quantity, and daily sales pace. Prices never change without your approval.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-status-success-bg border border-status-success/25 text-xs text-status-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {belowCostPrompt && (
        <div className="p-4 rounded-xl bg-status-danger-bg border border-status-danger/30 space-y-3">
          <div className="flex items-start gap-2 text-xs text-status-danger font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{belowCostPrompt.warning}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                applyDiscount(
                  belowCostPrompt.batchId,
                  belowCostPrompt.discountPercent,
                  true
                )
              }
              className="retail-btn-danger py-1.5 px-3 text-xs"
            >
              Confirm Below-Cost Price
            </button>
            <button
              type="button"
              onClick={() => setBelowCostPrompt(null)}
              className="retail-btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          Analyzing stock and sales velocity...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          No near-expiry slow-moving batches need discounting right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suggestions.map((s) => {
            const customVal = manualDiscounts[s.batchId] ?? String(s.suggestedDiscountPercent);
            return (
              <div key={s.id} className="retail-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-ink-primary">
                      {s.productName}
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Batch {s.batchNumber} · {s.availableQuantity} left · Expires in{" "}
                      <span className="font-semibold text-status-warning">
                        {s.daysRemaining} day{s.daysRemaining === 1 ? "" : "s"}
                      </span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-sage-soft text-accent-olive">
                    Suggested: {s.suggestedDiscountPercent}% off
                  </span>
                </div>

                <p className="text-xs text-ink-secondary bg-bg-main p-3 rounded-lg border border-border-warm">
                  {s.reason}
                </p>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-bg-secondary/60">
                    <p className="text-ink-secondary">Purchase / MRP</p>
                    <p className="font-semibold text-ink-primary mt-0.5">
                      ₹{s.purchasePrice} / ₹{s.mrp}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg-secondary/60">
                    <p className="text-ink-secondary">Suggested Price</p>
                    <p className="font-semibold text-accent-olive mt-0.5">
                      ₹{s.suggestedSellingPrice}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg-secondary/60">
                    <p className="text-ink-secondary">Loss Avoided</p>
                    <p className="font-semibold text-status-success mt-0.5">
                      ₹{s.potentialLossAvoided}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border-warm">
                  <button
                    type="button"
                    onClick={() =>
                      applyDiscount(s.batchId, s.suggestedDiscountPercent)
                    }
                    className="retail-btn-primary flex-1"
                  >
                    Apply {s.suggestedDiscountPercent}% AI Offer
                  </button>
                  <div className="flex gap-1.5 flex-1">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={customVal}
                      onChange={(e) =>
                        setManualDiscounts({
                          ...manualDiscounts,
                          [s.batchId]: e.target.value,
                        })
                      }
                      placeholder="% off"
                      className="retail-input py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        applyDiscount(s.batchId, Number(customVal) || 0)
                      }
                      className="retail-btn-secondary shrink-0 text-xs"
                    >
                      Apply Manual
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
