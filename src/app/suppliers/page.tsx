"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Truck, Plus, Phone, Mail, MapPin, Trash2, X } from "lucide-react";
import { Supplier } from "@/types/retail";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    categories: "",
    notes: "",
  });

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const json = await res.json();
      setSuppliers(json.suppliers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categories: form.categories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          name: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          categories: "",
          notes: "",
        });
        await loadSuppliers();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/suppliers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadSuppliers();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary flex items-center gap-2">
            <Truck className="w-5 h-5 text-accent-olive" />
            <span>Suppliers</span>
          </h1>
          <p className="text-sm text-ink-secondary">
            Manage your wholesale distributors and delivery contacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="retail-btn-primary self-start"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="retail-card p-8 text-center text-sm text-ink-secondary">
          Loading suppliers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="retail-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base text-ink-primary">
                    {sup.name}
                  </h3>
                  {sup.contactPerson && (
                    <p className="text-xs text-ink-secondary">
                      Contact: {sup.contactPerson}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(sup.id)}
                  className="p-1.5 rounded-md text-ink-muted hover:text-status-danger hover:bg-status-danger-bg"
                  title="Remove supplier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-ink-secondary">
                {sup.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-accent-olive" />
                    <span>{sup.phone}</span>
                  </p>
                )}
                {sup.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-accent-olive" />
                    <span>{sup.email}</span>
                  </p>
                )}
                {sup.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-accent-olive shrink-0" />
                    <span>{sup.address}</span>
                  </p>
                )}
              </div>

              {sup.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sup.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-bg-secondary text-ink-secondary border border-border-warm"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {sup.notes && (
                <p className="text-xs text-ink-secondary pt-2 border-t border-border-warm">
                  {sup.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 flex items-center justify-center p-4">
          <div className="bg-white border border-border-warm rounded-xl w-full max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">
                Add Supplier
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="retail-label">Supplier Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Contact Person</label>
                <input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  className="retail-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="retail-label">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="retail-input"
                  />
                </div>
                <div>
                  <label className="retail-label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="retail-input"
                  />
                </div>
              </div>
              <div>
                <label className="retail-label">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">
                  Categories (comma-separated)
                </label>
                <input
                  value={form.categories}
                  onChange={(e) =>
                    setForm({ ...form, categories: e.target.value })
                  }
                  placeholder="Dairy, Biscuits, Staples"
                  className="retail-input"
                />
              </div>
              <div>
                <label className="retail-label">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="retail-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="retail-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="retail-btn-primary"
                >
                  {saving ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
