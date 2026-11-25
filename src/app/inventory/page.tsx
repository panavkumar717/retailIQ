"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Package,
  Archive,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  QrCode,
  X,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import { ProductWithBatches, InventoryBatch } from "@/types/retail";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

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

function daysLeft(dateStr: string) {
  if (!dateStr) return 9999;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const e = new Date(dateStr);
  e.setHours(0, 0, 0, 0);
  return Math.ceil((e.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBatches | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductWithBatches | null>(null);
  const [qrPreview, setQrPreview] = useState<{ batch: InventoryBatch; productName: string; dataUrl: string } | null>(null);

  // Add Form State
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "Biscuits & Snacks",
    unit: "packets",
    lowStockThreshold: 10,
    barcode: "",
    batchNumber: "",
    quantity: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    manufacturingDate: "",
    expiryDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?archived=${showArchived}`);
      const json = await res.json();
      setProducts(json.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!showArchived && p.isArchived) return false;
      if (showArchived && !p.isArchived) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      if (categoryFilter !== "All" && p.category !== categoryFilter) {
        return false;
      }

      if (expiryFilter === "expiring_7") {
        return p.batches.some((b) => b.quantity > 0 && daysLeft(b.expiryDate) >= 0 && daysLeft(b.expiryDate) <= 7);
      }
      if (expiryFilter === "expiring_30") {
        return p.batches.some((b) => b.quantity > 0 && daysLeft(b.expiryDate) >= 0 && daysLeft(b.expiryDate) <= 30);
      }
      if (expiryFilter === "expired") {
        return p.batches.some((b) => b.quantity > 0 && daysLeft(b.expiryDate) < 0);
      }
      if (expiryFilter === "low_stock") {
        return p.status === "low_stock" || p.status === "out_of_stock";
      }

      return true;
    });
  }, [products, search, categoryFilter, expiryFilter, showArchived]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lowStockThreshold: Number(form.lowStockThreshold),
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp),
          source: "IN_MANUAL",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Failed to save product");
      } else {
        setAddModalOpen(false);
        setForm({
          name: "",
          brand: "",
          category: "Biscuits & Snacks",
          unit: "packets",
          lowStockThreshold: 10,
          barcode: "",
          batchNumber: "",
          quantity: 10,
          purchasePrice: 0,
          sellingPrice: 0,
          mrp: 0,
          manufacturingDate: "",
          expiryDate: "",
        });
        await loadProducts();
      }
    } catch {
      setErrorMsg("Network error while saving product.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProduct.name,
          brand: editingProduct.brand,
          category: editingProduct.category,
          unit: editingProduct.unit,
          lowStockThreshold: Number(editingProduct.lowStockThreshold),
          barcode: editingProduct.barcode,
        }),
      });
      setEditingProduct(null);
      await loadProducts();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (product: ProductWithBatches) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !product.isArchived }),
    });
    await loadProducts();
  };

  const openBatchQr = async (batch: InventoryBatch, productName: string) => {
    const payload =
      batch.qrCodePayload ||
      JSON.stringify({
        type: "RETAIL_IQ_BATCH",
        batchId: batch.id,
        productId: batch.productId,
        batchNumber: batch.batchNumber,
      });
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: "#292B27", light: "#FFFFFF" },
    });
    setQrPreview({ batch, productName, dataUrl });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
            My Inventory
          </h1>
          <p className="text-sm text-ink-secondary">
            Track products, batch-wise quantities, prices, and expiry dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`retail-btn-secondary ${
              showArchived ? "bg-bg-secondary border-border-strong" : ""
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? "View Active" : "Archived"}</span>
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="retail-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="retail-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, brand, or barcode..."
            className="retail-input pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="retail-input"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="retail-input"
        >
          <option value="all">All Stock & Expiry</option>
          <option value="expiring_7">Expiring within 7 days</option>
          <option value="expiring_30">Expiring within 30 days</option>
          <option value="expired">Has Expired Batches</option>
          <option value="low_stock">Low / Out of Stock</option>
        </select>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          Loading inventory...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products match your filters"
          description="Try clearing your search or add a new product batch to your store inventory."
          action={
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="retail-btn-primary"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block retail-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-secondary/70 border-b border-border-warm text-xs font-medium text-ink-secondary">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Buy / Sell / MRP</th>
                  <th className="py-3 px-4">Earliest Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-sm">
                {filtered.map((prod) => {
                  const firstBatch = prod.batches[0];
                  const isExpanded = Boolean(expandedIds[prod.id]);
                  return (
                    <React.Fragment key={prod.id}>
                      <tr className="hover:bg-bg-main/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-bg-secondary border border-border-warm flex items-center justify-center text-accent-olive font-semibold text-xs shrink-0">
                              {prod.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-ink-primary">
                                {prod.name}
                              </p>
                              <p className="text-xs text-ink-secondary">
                                {prod.brand || "Generic"} · {prod.batches.length} batch
                                {prod.batches.length === 1 ? "" : "es"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-secondary text-xs">
                          {prod.category}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-ink-primary">
                          {prod.totalQuantity} {prod.unit}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-ink-secondary">
                          {firstBatch
                            ? `₹${firstBatch.purchasePrice} / ₹${firstBatch.sellingPrice} / ₹${firstBatch.mrp}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-ink-secondary">
                          {prod.earliestExpiry || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={prod.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(prod.id)}
                              title="Show Batches"
                              className="p-1.5 rounded-md border border-border-warm text-ink-secondary hover:bg-bg-secondary"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingProduct(prod)}
                              title="View Details"
                              className="p-1.5 rounded-md border border-border-warm text-ink-secondary hover:bg-bg-secondary"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(prod)}
                              title="Edit Product"
                              className="p-1.5 rounded-md border border-border-warm text-ink-secondary hover:bg-bg-secondary"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(prod)}
                              title={prod.isArchived ? "Restore" : "Archive"}
                              className="p-1.5 rounded-md border border-border-warm text-ink-secondary hover:bg-bg-secondary"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-bg-main">
                          <td colSpan={7} className="px-6 py-3">
                            <p className="text-xs font-semibold text-ink-secondary mb-2">
                              Batch-wise Stock ({prod.batches.length})
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                              {prod.batches.map((b) => {
                                const d = daysLeft(b.expiryDate);
                                return (
                                  <div
                                    key={b.id}
                                    className="p-3 rounded-lg bg-white border border-border-warm flex items-center justify-between gap-3"
                                  >
                                    <div>
                                      <p className="text-xs font-semibold text-ink-primary">
                                        Batch {b.batchNumber} · {b.quantity} {prod.unit}
                                      </p>
                                      <p className="text-xs text-ink-secondary mt-0.5">
                                        Buy ₹{b.purchasePrice} · Sell ₹{b.sellingPrice} · MRP ₹{b.mrp} · Exp:{" "}
                                        <span
                                          className={
                                            d < 0
                                              ? "text-status-danger font-medium"
                                              : d <= 7
                                              ? "text-status-warning font-medium"
                                              : ""
                                          }
                                        >
                                          {b.expiryDate || "N/A"}
                                          {d < 0 ? " (Expired)" : d <= 30 ? ` (${d}d)` : ""}
                                        </span>
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openBatchQr(b, prod.name)}
                                      className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>QR</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((prod) => (
              <div key={prod.id} className="retail-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-ink-primary">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      {prod.brand || "Generic"} · {prod.category}
                    </p>
                  </div>
                  <StatusBadge status={prod.status} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-bg-main p-2.5 rounded-lg border border-border-warm">
                  <div>
                    <p className="text-ink-secondary">Available</p>
                    <p className="font-semibold text-ink-primary">
                      {prod.totalQuantity} {prod.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-secondary">Sell / MRP</p>
                    <p className="font-semibold text-ink-primary">
                      {prod.batches[0]
                        ? `₹${prod.batches[0].sellingPrice} / ₹${prod.batches[0].mrp}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-secondary">Earliest Exp</p>
                    <p className="font-semibold text-ink-primary">
                      {prod.earliestExpiry || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(prod.id)}
                    className="text-xs font-medium text-accent-olive"
                  >
                    {expandedIds[prod.id]
                      ? "Hide batches"
                      : `View ${prod.batches.length} batch(es)`}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(prod)}
                      className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                    >
                      {prod.isArchived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>

                {expandedIds[prod.id] && (
                  <div className="space-y-2 pt-2 border-t border-border-warm">
                    {prod.batches.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-medium text-ink-primary">
                            {b.batchNumber} · {b.quantity} {prod.unit}
                          </p>
                          <p className="text-ink-secondary">
                            Exp: {b.expiryDate || "N/A"} · ₹{b.sellingPrice}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openBatchQr(b, prod.name)}
                          className="retail-btn-secondary py-1 px-2 text-xs"
                        >
                          QR
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Product / Batch Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 flex items-center justify-center p-4">
          <div className="bg-white border border-border-warm rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">
                Add Product / New Stock Batch
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-status-danger-bg text-status-danger text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="retail-label">Product Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Good Day Butter Biscuits"
                    className="retail-input"
                  />
                </div>
                <div>
                  <label className="retail-label">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Britannia"
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
                    min={0}
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
                    placeholder="packets / pieces / kg"
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="retail-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="retail-btn-primary"
                >
                  {saving ? "Saving..." : "Save to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 flex items-center justify-center p-4">
          <div className="bg-white border border-border-warm rounded-xl w-full max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">
                Edit Product
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-3.5">
              <div>
                <label className="retail-label">Product Name</label>
                <input
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Brand</label>
                <input
                  value={editingProduct.brand}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, brand: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="retail-label">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
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
                  <label className="retail-label">Low Stock Alert</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.lowStockThreshold}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    className="retail-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="retail-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="retail-btn-primary"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 flex items-center justify-center p-4">
          <div className="bg-white border border-border-warm rounded-xl w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-primary">
                  {viewingProduct.name}
                </h2>
                <p className="text-xs text-ink-secondary">
                  {viewingProduct.brand || "Generic"} · {viewingProduct.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {viewingProduct.batches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-ink-primary">
                      Batch {b.batchNumber} ({b.quantity} {viewingProduct.unit})
                    </p>
                    <p className="text-ink-secondary mt-0.5">
                      Buy ₹{b.purchasePrice} · Sell ₹{b.sellingPrice} · MRP ₹{b.mrp}
                    </p>
                    <p className="text-ink-secondary">
                      Expiry: {b.expiryDate || "Not set"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBatchQr(b, viewingProduct.name)}
                    className="retail-btn-secondary py-1.5 px-2.5 text-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch QR Modal */}
      {qrPreview && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 flex items-center justify-center p-4">
          <div className="bg-white border border-border-warm rounded-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink-primary">
                Batch QR Label
              </h3>
              <button
                type="button"
                onClick={() => setQrPreview(null)}
                className="p-1 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-bg-main rounded-xl border border-border-warm inline-block">
              <img
                src={qrPreview.dataUrl}
                alt={`QR for ${qrPreview.batch.batchNumber}`}
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="text-xs text-ink-secondary">
              <p className="font-semibold text-ink-primary text-sm">
                {qrPreview.productName}
              </p>
              <p>
                Batch: {qrPreview.batch.batchNumber} · Exp:{" "}
                {qrPreview.batch.expiryDate || "N/A"}
              </p>
            </div>
            <a
              href={qrPreview.dataUrl}
              download={`QR-${qrPreview.batch.batchNumber}.png`}
              className="retail-btn-primary w-full"
            >
              <Download className="w-4 h-4" /> Download QR PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
