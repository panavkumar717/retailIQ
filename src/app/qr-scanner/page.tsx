"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  Search,
  Download,
  AlertCircle,
} from "lucide-react";
import QRCode from "qrcode";

const CATEGORIES = [
  "Biscuits & Snacks",
  "Dairy & Bakery",
  "Staples",
  "Beverages",
  "Personal Care",
  "Household",
  "Medicines",
  "Other",
];

export default function QrScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [lookupStatus, setLookupStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedQrUrl, setSavedQrUrl] = useState<string>("");
  const [savedBatchLabel, setSavedBatchLabel] = useState<string>("");

  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const [form, setForm] = useState({
    productId: "",
    name: "",
    brand: "",
    category: "Biscuits & Snacks",
    unit: "packets",
    barcode: "",
    batchNumber: "",
    quantity: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    manufacturingDate: "",
    expiryDate: "",
  });

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors if already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleLookup = async (code: string) => {
    if (!code.trim()) return;
    setLookupStatus("Checking product registry...");
    try {
      const res = await fetch("/api/qr/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.matched && json.product) {
        const p = json.product;
        const b = json.batch;
        setForm((prev) => ({
          ...prev,
          productId: p.id,
          name: p.name || "",
          brand: p.brand || "",
          category: p.category || "Other",
          unit: p.unit || "packets",
          barcode: p.barcode || code,
          batchNumber: b?.batchNumber || "",
          purchasePrice: b?.purchasePrice ?? prev.purchasePrice,
          sellingPrice: b?.sellingPrice ?? prev.sellingPrice,
          mrp: b?.mrp ?? prev.mrp,
          manufacturingDate: b?.manufacturingDate || "",
          expiryDate: b?.expiryDate || "",
        }));
        setLookupStatus(
          `Matched "${p.name}" (${json.matchType.replace(/_/g, " ")}). Verify quantity and expiry date below.`
        );
      } else {
        setForm((prev) => ({
          ...prev,
          productId: "",
          barcode: code.startsWith("{") ? "" : code,
        }));
        setLookupStatus(
          json.message || "Code not found in store registry. Enter product details below."
        );
      }
    } catch {
      setLookupStatus("Could not look up code.");
    }
  };

  const startCamera = async () => {
    setScanError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5Qr = new Html5Qrcode("retailiq-qr-reader");
      scannerRef.current = html5Qr;
      setScanning(true);

      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          setManualCode(decodedText);
          await stopCamera();
          await handleLookup(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setScanError(
        err instanceof Error
          ? `Camera unavailable: ${err.message}. You can enter or paste a QR/barcode value below.`
          : "Camera permission denied or unavailable on this device."
      );
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setScanError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productId: form.productId || undefined,
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp),
          source: "IN_QR",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setScanError(json.error || "Failed to add stock");
      } else {
        const qrDataUrl = await QRCode.toDataURL(json.batch.qrCodePayload, {
          width: 260,
          margin: 2,
          color: { dark: "#292B27", light: "#FFFFFF" },
        });
        setSavedQrUrl(qrDataUrl);
        setSavedBatchLabel(`${json.product.name} · Batch ${json.batch.batchNumber}`);
        setLookupStatus("Stock added to inventory and unique batch QR code generated.");
      }
    } catch {
      setScanError("Failed to save stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
          QR Scanner & Batch Labels
        </h1>
        <p className="text-sm text-ink-secondary">
          Scan incoming product codes with your camera or generate unique Retail IQ QR labels for new batches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera Scanner & Code Lookup */}
        <div className="retail-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-primary">
              1. Scan Incoming Code
            </h2>
            {!scanning ? (
              <button
                type="button"
                onClick={startCamera}
                className="retail-btn-primary"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="retail-btn-danger"
              >
                <CameraOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border-warm bg-bg-secondary overflow-hidden min-h-[240px] flex items-center justify-center relative">
            <div id="retailiq-qr-reader" className="w-full" />
            {!scanning && (
              <div className="text-center p-6 pointer-events-none">
                <QrCode className="w-10 h-10 text-ink-muted mx-auto mb-2" />
                <p className="text-xs text-ink-secondary">
                  Tap &ldquo;Open Camera&rdquo; to scan a product QR code or barcode.
                </p>
              </div>
            )}
          </div>

          {scanError && (
            <div className="p-3 rounded-lg bg-status-danger-bg border border-status-danger/20 text-xs text-status-danger flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Manual Code Entry */}
          <div className="pt-2 border-t border-border-warm">
            <label className="retail-label">Or Enter / Paste QR or Barcode Value</label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 8901063012349 or GD-2026-A"
                className="retail-input"
              />
              <button
                type="button"
                onClick={() => handleLookup(manualCode)}
                className="retail-btn-secondary shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Lookup</span>
              </button>
            </div>
            {lookupStatus && (
              <p className="text-xs text-accent-olive mt-2 font-medium">
                {lookupStatus}
              </p>
            )}
          </div>

          {/* Generated Batch QR Output */}
          {savedQrUrl && (
            <div className="p-4 rounded-xl bg-bg-main border border-border-warm text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-status-success text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Batch QR Ready: {savedBatchLabel}</span>
              </div>
              <img
                src={savedQrUrl}
                alt="Generated Batch QR"
                className="w-40 h-40 mx-auto rounded-lg border border-border-warm bg-white p-2"
              />
              <a
                href={savedQrUrl}
                download={`RetailIQ-Batch-QR.png`}
                className="retail-btn-secondary w-full"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Label</span>
              </a>
            </div>
          )}
        </div>

        {/* Right: Confirm & Add Stock Form */}
        <div className="retail-card p-5">
          <h2 className="text-base font-semibold text-ink-primary mb-4">
            2. Confirm Batch Details & Add Stock
          </h2>
          <form onSubmit={handleSaveStock} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="retail-label">Product Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Brand name"
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="retail-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="retail-label">Quantity Received *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Unit</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Purchase Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, purchasePrice: Number(e.target.value) })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Selling Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: Number(e.target.value) })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">MRP (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.mrp}
                  onChange={(e) =>
                    setForm({ ...form, mrp: Number(e.target.value) })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Batch Number</label>
                <input
                  value={form.batchNumber}
                  onChange={(e) =>
                    setForm({ ...form, batchNumber: e.target.value })
                  }
                  placeholder="Auto-generated if blank"
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Manufacturing Date</label>
                <input
                  type="date"
                  value={form.manufacturingDate}
                  onChange={(e) =>
                    setForm({ ...form, manufacturingDate: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="retail-btn-primary w-full mt-2"
            >
              {saving ? "Saving Batch..." : "Confirm & Add Stock + Generate QR"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
