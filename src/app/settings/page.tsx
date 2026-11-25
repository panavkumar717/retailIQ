"use client";

import React, { useEffect, useState } from "react";
import { Settings, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { ShopProfile, SocialIntegrationStatus } from "@/types/retail";

export default function SettingsPage() {
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [env, setEnv] = useState<{
    supabaseConfigured: boolean;
    geminiConfigured: boolean;
    socialIntegrations: SocialIntegrationStatus[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        setShop(json.shop);
        setEnv(json.environment);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shop),
      });
      if (res.ok) {
        setNotice("Shop details updated successfully.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_demo" }),
    });
    if (res.ok) {
      const json = await res.json();
      setShop(json.shop);
      setNotice("Store data reset to initial sample inventory.");
    }
  };

  if (!shop) {
    return (
      <div className="retail-card p-8 text-center text-sm text-ink-secondary">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-olive" />
          <span>Settings & Integrations</span>
        </h1>
        <p className="text-sm text-ink-secondary">
          Manage your shop profile, contact details for promotional posters, and connected services.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-status-success-bg border border-status-success/25 text-xs text-status-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Profile */}
        <div className="retail-card p-5">
          <h2 className="text-base font-semibold text-ink-primary mb-4">
            Shop Profile
          </h2>
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="retail-label">Shop Name</label>
              <input
                required
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                className="retail-input"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="retail-label">Owner Name</label>
                <input
                  value={shop.ownerName}
                  onChange={(e) => setShop({ ...shop, ownerName: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Business Type</label>
                <input
                  value={shop.businessType}
                  onChange={(e) =>
                    setShop({ ...shop, businessType: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Phone</label>
                <input
                  value={shop.phone}
                  onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">GST Number</label>
                <input
                  value={shop.gstNumber}
                  onChange={(e) => setShop({ ...shop, gstNumber: e.target.value })}
                  className="retail-input"
                />
              </div>
            </div>
            <div>
              <label className="retail-label">Store Address</label>
              <textarea
                rows={2}
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                className="retail-input"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="retail-btn-primary"
            >
              {saving ? "Saving..." : "Save Shop Profile"}
            </button>
          </form>
        </div>

        {/* Service & API Status */}
        <div className="space-y-5">
          <div className="retail-card p-5 space-y-3">
            <h2 className="text-base font-semibold text-ink-primary">
              Service Configuration Status
            </h2>
            <p className="text-xs text-ink-secondary">
              Configure API keys in <code className="bg-bg-secondary px-1.5 py-0.5 rounded">.env.local</code> (see <code className="bg-bg-secondary px-1.5 py-0.5 rounded">.env.example</code>).
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between text-xs">
                <span className="font-medium text-ink-primary">
                  Supabase Database & Auth
                </span>
                {env?.supabaseConfigured ? (
                  <span className="inline-flex items-center gap-1 text-status-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-warning font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Local JSON Store Active
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between text-xs">
                <span className="font-medium text-ink-primary">
                  Gemini AI (Voice, Bill OCR, Posters)
                </span>
                {env?.geminiConfigured ? (
                  <span className="inline-flex items-center gap-1 text-status-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-warning font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Missing GEMINI_API_KEY
                  </span>
                )}
              </div>

              {env?.socialIntegrations.map((s) => (
                <div
                  key={s.platform}
                  className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-ink-primary capitalize">
                    {s.platform} Integration
                  </span>
                  <span
                    className={
                      s.connected
                        ? "text-status-success font-medium"
                        : "text-ink-secondary"
                    }
                  >
                    {s.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="retail-card p-5 space-y-3">
            <h2 className="text-base font-semibold text-ink-primary">
              Data Management
            </h2>
            <p className="text-xs text-ink-secondary">
              Restore the initial sample products, batches, suppliers, and sales records.
            </p>
            <button
              type="button"
              onClick={handleResetDemo}
              className="retail-btn-secondary"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sample Store Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
