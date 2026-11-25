"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Megaphone,
  Download,
  Share2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Instagram,
} from "lucide-react";
import {
  Campaign,
  CampaignProductItem,
  ProductWithBatches,
  ShopProfile,
  SocialIntegrationStatus,
} from "@/types/retail";

const FESTIVALS = [
  "Diwali",
  "Dussehra",
  "Ugadi",
  "Sankranti",
  "Christmas",
  "New Year",
  "Independence Day",
  "Custom Event",
];

export default function PromotionsPage() {
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [social, setSocial] = useState<SocialIntegrationStatus[]>([]);

  const [festival, setFestival] = useState("Diwali");
  const [customFestival, setCustomFestival] = useState("");
  const [title, setTitle] = useState("Diwali Special Store Offers");
  const [message, setMessage] = useState(
    "Celebrate with fresh groceries and festive savings at our neighbourhood store!"
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [commonDiscount, setCommonDiscount] = useState(10);
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [posterDataUrl, setPosterDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadData = useCallback(async () => {
    const [prodRes, promoRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/promotions"),
    ]);
    const prodJson = await prodRes.json();
    const promoJson = await promoRes.json();

    const activeProds: ProductWithBatches[] = (prodJson.products || []).filter(
      (p: ProductWithBatches) => p.batches.length > 0
    );
    setProducts(activeProds);
    setShop(promoJson.shop || null);
    setCampaigns(promoJson.campaigns || []);
    setSocial(promoJson.socialIntegrations || []);

    if (activeProds.length >= 2) {
      setSelectedMap((prev) =>
        Object.keys(prev).length > 0
          ? prev
          : {
              [activeProds[0].id]: 10,
              [activeProds[1].id]: 12,
            }
      );
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedItems: CampaignProductItem[] = products
    .filter((p) => selectedMap[p.id] !== undefined && p.batches[0])
    .map((p) => {
      const b = p.batches[0];
      const orig = b.mrp > 0 ? b.mrp : b.sellingPrice;
      const disc = selectedMap[p.id] || 0;
      return {
        productId: p.id,
        productName: p.name,
        batchId: b.id,
        originalPrice: orig,
        discountPercent: disc,
        offerPrice: Number((orig * (1 - disc / 100)).toFixed(2)),
      };
    });

  const renderCanvasPoster = useCallback(
    async (customBg: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !shop) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 900;
      const H = 1120;
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = "#FAF9F6";
      ctx.fillRect(0, 0, W, H);

      if (customBg) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.globalAlpha = 0.28;
            ctx.drawImage(img, 0, 0, W, H);
            ctx.globalAlpha = 1;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = customBg;
        });
      }

      // Editorial border frame
      ctx.strokeStyle = "#68765B";
      ctx.lineWidth = 4;
      ctx.strokeRect(32, 32, W - 64, H - 64);

      ctx.strokeStyle = "#E8E6DF";
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, W - 96, H - 96);

      // Festival badge
      const activeFest =
        festival === "Custom Event" && customFestival.trim()
          ? customFestival.trim()
          : festival;
      ctx.fillStyle = "#EDF0E8";
      ctx.fillRect(W / 2 - 140, 74, 280, 40);
      ctx.fillStyle = "#68765B";
      ctx.font = "600 18px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(activeFest.toUpperCase() + " SPECIAL", W / 2, 100);

      // Shop Name
      ctx.fillStyle = "#292B27";
      ctx.font = "700 36px Inter, system-ui, sans-serif";
      ctx.fillText(shop.name, W / 2, 165);

      // Title
      ctx.fillStyle = "#68765B";
      ctx.font = "600 24px Inter, system-ui, sans-serif";
      ctx.fillText(title, W / 2, 210);

      // Message
      ctx.fillStyle = "#77786F";
      ctx.font = "400 18px Inter, system-ui, sans-serif";
      ctx.fillText(message.slice(0, 75), W / 2, 250);

      // Product Offer Cards
      let y = 300;
      const itemsToDraw = selectedItems.slice(0, 5);
      for (const item of itemsToDraw) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(80, y, W - 160, 108);
        ctx.strokeStyle = "#E8E6DF";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, y, W - 160, 108);

        ctx.textAlign = "left";
        ctx.fillStyle = "#292B27";
        ctx.font = "600 22px Inter, system-ui, sans-serif";
        ctx.fillText(item.productName.slice(0, 34), 108, y + 44);

        ctx.fillStyle = "#77786F";
        ctx.font = "400 17px Inter, system-ui, sans-serif";
        ctx.fillText(`MRP ₹${item.originalPrice}`, 108, y + 78);

        ctx.textAlign = "right";
        ctx.fillStyle = "#68765B";
        ctx.font = "700 28px Inter, system-ui, sans-serif";
        ctx.fillText(`₹${item.offerPrice}`, W - 108, y + 48);

        ctx.fillStyle = "#B96C5C";
        ctx.font = "600 16px Inter, system-ui, sans-serif";
        ctx.fillText(`${item.discountPercent}% OFF`, W - 108, y + 78);

        y += 124;
      }

      // Footer
      ctx.textAlign = "center";
      ctx.fillStyle = "#F4F2EC";
      ctx.fillRect(80, H - 180, W - 160, 100);
      ctx.fillStyle = "#292B27";
      ctx.font = "600 18px Inter, system-ui, sans-serif";
      ctx.fillText(`Valid: ${startDate} to ${endDate}`, W / 2, H - 140);
      ctx.fillStyle = "#77786F";
      ctx.font = "400 16px Inter, system-ui, sans-serif";
      ctx.fillText(`${shop.address} · ${shop.phone}`, W / 2, H - 106);

      setPosterDataUrl(canvas.toDataURL("image/png"));
    },
    [shop, festival, customFestival, title, message, selectedItems, startDate, endDate]
  );

  useEffect(() => {
    if (shop) {
      renderCanvasPoster(bgImageUrl);
    }
  }, [shop, bgImageUrl, renderCanvasPoster]);

  const handleGeneratePoster = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/promotions/generate-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festival: festival === "Custom Event" ? customFestival || "Festival" : festival,
          styleNote: title,
        }),
      });
      const json = await res.json();
      if (json.backgroundUrl) {
        setBgImageUrl(json.backgroundUrl);
        await renderCanvasPoster(json.backgroundUrl);
        setNotice({
          type: "success",
          text: "AI festival background generated and verified prices applied.",
        });
      } else {
        await renderCanvasPoster(null);
        setNotice({
          type: "info",
          text:
            json.message ||
            json.error ||
            "Poster rendered with warm editorial template.",
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (selectedItems.length === 0) {
      setNotice({ type: "error", text: "Select at least one product." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          festival: festival === "Custom Event" ? customFestival || "Custom" : festival,
          message,
          startDate,
          endDate,
          products: selectedItems,
          status: "active",
        }),
      });
      if (res.ok) {
        setNotice({ type: "success", text: "Campaign saved to Promotions history." });
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const buildShareText = () => {
    const lines = selectedItems.map(
      (i) => `• ${i.productName}: ₹${i.offerPrice} (${i.discountPercent}% OFF, MRP ₹${i.originalPrice})`
    );
    return `${shop?.name || "Retail IQ"} — ${title}\n${message}\n\n${lines.join(
      "\n"
    )}\n\nValid ${startDate} to ${endDate}. Visit or call ${shop?.phone || ""}`;
  };

  const handleNativeShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // User cancelled or file share unsupported
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const toggleProduct = (id: string) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (copy[id] !== undefined) {
        delete copy[id];
      } else {
        copy[id] = commonDiscount;
      }
      return copy;
    });
  };

  const applyCommonDiscount = () => {
    setSelectedMap((prev) => {
      const next: Record<string, number> = {};
      for (const k of Object.keys(prev)) {
        next[k] = commonDiscount;
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent-olive" />
          <span>Promotions & Festival Posters</span>
        </h1>
        <p className="text-sm text-ink-secondary">
          Build festive promotional posters with verified store prices and share them on WhatsApp or social channels.
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
        {/* Builder Form */}
        <div className="retail-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-ink-primary">
            1. Campaign Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="retail-label">Festival / Event</label>
              <select
                value={festival}
                onChange={(e) => setFestival(e.target.value)}
                className="retail-input"
              >
                {FESTIVALS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            {festival === "Custom Event" && (
              <div>
                <label className="retail-label">Custom Event Name</label>
                <input
                  value={customFestival}
                  onChange={(e) => setCustomFestival(e.target.value)}
                  placeholder="e.g. Weekend Mega Sale"
                  className="retail-input"
                />
              </div>
            )}
            <div className={festival === "Custom Event" ? "sm:col-span-2" : ""}>
              <label className="retail-label">Campaign Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="retail-input"
              />
            </div>
            <div>
              <label className="retail-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="retail-input"
              />
            </div>
            <div>
              <label className="retail-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="retail-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="retail-label">Promotional Message</label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="retail-input"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border-warm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-primary">
                2. Select Products & Discounts (max 5 on poster)
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={commonDiscount}
                  onChange={(e) => setCommonDiscount(Number(e.target.value))}
                  className="retail-input w-20 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={applyCommonDiscount}
                  className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                >
                  Apply % to All
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {products.map((p) => {
                const isSelected = selectedMap[p.id] !== undefined;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-accent-sage-soft/50 border-accent-sage"
                        : "bg-bg-main border-border-warm"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded border-border-strong text-accent-olive"
                      />
                      <span className="truncate font-medium text-ink-primary">
                        {p.name} (₹{p.batches[0]?.mrp || p.batches[0]?.sellingPrice})
                      </span>
                    </label>
                    {isSelected && (
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={selectedMap[p.id]}
                        onChange={(e) =>
                          setSelectedMap({
                            ...selectedMap,
                            [p.id]: Number(e.target.value),
                          })
                        }
                        className="retail-input w-20 py-1 text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleGeneratePoster}
              disabled={generating}
              className="retail-btn-primary flex-1"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
              <span>{generating ? "Generating..." : "Generate Poster"}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCampaign}
              disabled={saving}
              className="retail-btn-secondary"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Campaign"}</span>
            </button>
          </div>
        </div>

        {/* Poster Preview & Sharing */}
        <div className="retail-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-primary">
              Poster Preview
            </h2>
            {posterDataUrl && (
              <a
                href={posterDataUrl}
                download={`${festival.replace(/\s+/g, "-")}-Poster.png`}
                className="retail-btn-secondary py-1.5 px-3 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download PNG
              </a>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="rounded-xl border border-border-warm bg-bg-main p-3 flex items-center justify-center">
            {posterDataUrl ? (
              <img
                src={posterDataUrl}
                alt="Festival Poster Preview"
                className="w-full max-w-md rounded-lg border border-border-warm"
              />
            ) : (
              <p className="text-xs text-ink-secondary py-12">
                Select products to preview your promotional poster.
              </p>
            )}
          </div>

          {/* Sharing Options */}
          <div className="pt-2 border-t border-border-warm space-y-3">
            <p className="text-xs font-semibold text-ink-primary">
              Share Campaign
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="retail-btn-primary"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={handleNativeShare}
                className="retail-btn-secondary"
              >
                <Share2 className="w-4 h-4" />
                <span>Native Share / Social</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {social.map((s) => (
                <div
                  key={s.platform}
                  className="p-2.5 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Instagram className="w-3.5 h-3.5 text-ink-secondary" />
                    <span className="capitalize font-medium text-ink-primary">
                      {s.platform}
                    </span>
                  </div>
                  <span
                    className={
                      s.connected ? "text-status-success font-medium" : "text-ink-secondary"
                    }
                  >
                    {s.connected ? "Connected" : "Not configured (manual share ready)"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Campaigns */}
      {campaigns.length > 0 && (
        <div className="retail-card p-5">
          <h2 className="text-base font-semibold text-ink-primary mb-3">
            Saved Campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-lg bg-bg-main border border-border-warm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-ink-primary">{c.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-sage-soft text-accent-olive">
                    {c.festival}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary mt-1">{c.message}</p>
                <p className="text-[11px] text-ink-muted mt-2">
                  {c.startDate} to {c.endDate} · {c.products.length} products
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
