"use client";

import React, { useRef, useState } from "react";
import { Mic, MicOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

const LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
];

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

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function VoiceEntryPage() {
  const [language, setLanguage] = useState("en-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "Biscuits & Snacks",
    quantity: "",
    unit: "packets",
    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    expiryDate: "",
  });

  const startListening = () => {
    setNotice(null);
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setNotice({
        type: "error",
        text: "Voice recognition is not supported in this browser. Please use Chrome/Edge or type the spoken text below.",
      });
      return;
    }

    const rec = new SpeechRec();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript + " ";
      }
      setTranscript(combined.trim());
    };

    rec.onerror = (event) => {
      setListening(false);
      setNotice({
        type: "error",
        text: `Microphone error: ${event.error}.`,
      });
    };

    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleExtract = async () => {
    if (!transcript.trim()) {
      setNotice({ type: "error", text: "Record or enter spoken product text first." });
      return;
    }
    setParsing(true);
    setNotice(null);
    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
      });
      const json = await res.json();

      if (!json.configured) {
        setNotice({
          type: "info",
          text: json.message,
        });
        return;
      }

      if (!res.ok) {
        setNotice({
          type: "error",
          text: json.error || "Could not extract product details.",
        });
        return;
      }

      const ext = json.extracted || {};
      setForm({
        name: ext.productName || "",
        brand: ext.brand || "",
        category: CATEGORIES.includes(ext.category) ? ext.category : "Other",
        quantity: ext.quantity !== null && ext.quantity !== undefined ? String(ext.quantity) : "",
        unit: ext.unit || "packets",
        purchasePrice:
          ext.purchasePrice !== null && ext.purchasePrice !== undefined
            ? String(ext.purchasePrice)
            : "",
        sellingPrice:
          ext.sellingPrice !== null && ext.sellingPrice !== undefined
            ? String(ext.sellingPrice)
            : "",
        mrp: ext.mrp !== null && ext.mrp !== undefined ? String(ext.mrp) : "",
        expiryDate: ext.expiryDate || "",
      });

      setNotice({
        type: "success",
        text: "Extracted spoken details. Missing fields were left blank—please verify and save.",
      });
    } catch {
      setNotice({ type: "error", text: "Failed to connect to voice extraction service." });
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          category: form.category,
          unit: form.unit || "packets",
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp || form.sellingPrice),
          expiryDate: form.expiryDate,
          source: "IN_VOICE",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: json.error || "Failed to save product" });
      } else {
        setNotice({
          type: "success",
          text: `Saved "${json.product.name}" (${json.batch.quantity} ${json.product.unit}) to inventory.`,
        });
        setTranscript("");
        setForm({
          name: "",
          brand: "",
          category: "Biscuits & Snacks",
          quantity: "",
          unit: "packets",
          purchasePrice: "",
          sellingPrice: "",
          mrp: "",
          expiryDate: "",
        });
      }
    } catch {
      setNotice({ type: "error", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
          Voice Stock Entry
        </h1>
        <p className="text-sm text-ink-secondary">
          Speak product details naturally—for example: &ldquo;Add five packets of Good Day biscuits, purchase price eight rupees, selling price ten rupees, expiry date first April 2027.&rdquo;
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
        {/* Left: Microphone Capture */}
        <div className="retail-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-ink-primary">
              1. Record Speech
            </h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="retail-input sm:w-48"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-xl bg-bg-main border border-border-warm flex flex-col items-center justify-center text-center space-y-3">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                listening
                  ? "bg-status-danger text-white"
                  : "bg-accent-olive text-white hover:bg-accent-olive-hover"
              }`}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <p className="text-xs font-medium text-ink-secondary">
              {listening
                ? "Listening... Tap microphone to stop."
                : "Tap the microphone and speak clearly."}
            </p>
          </div>

          <div>
            <label className="retail-label">Spoken Text (Editable)</label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here..."
              className="retail-input"
            />
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={parsing || !transcript.trim()}
            className="retail-btn-primary w-full"
          >
            <Sparkles className="w-4 h-4" />
            <span>{parsing ? "Extracting..." : "Extract Product Details"}</span>
          </button>
        </div>

        {/* Right: Confirm & Save */}
        <div className="retail-card p-5">
          <h2 className="text-base font-semibold text-ink-primary mb-4">
            2. Verify & Save to Inventory
          </h2>
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="retail-label">Product Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
                <label className="retail-label">Quantity *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
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
                    setForm({ ...form, purchasePrice: e.target.value })
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
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
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
              className="retail-btn-primary w-full"
            >
              {saving ? "Saving..." : "Confirm & Save Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
