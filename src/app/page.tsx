"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingDown,
  Wallet,
  ShieldAlert,
  QrCode,
  Mic,
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  shop: { name: string; ownerName: string };
  summary: {
    totalProducts: number;
    availableStock: number;
    todaysSales: number;
    expiringSoonCount: number;
    expiredCount: number;
    lowStockCount: number;
    totalStockValue: number;
    potentialLossFromExpiry: number;
  };
  analytics: {
    dailySales: Array<{ date: string; revenue: number; profit: number }>;
    monthlySales: Array<{ month: string; revenue: number; profit: number }>;
    categoryStock: Array<{ category: string; quantity: number; value: number }>;
  };
  suggestions: Array<{
    id: string;
    productName: string;
    batchNumber: string;
    daysRemaining: number;
    suggestedDiscountPercent: number;
    suggestedSellingPrice: number;
    potentialLossAvoided: number;
  }>;
  expiryAlerts: Array<{
    batchId: string;
    productName: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    daysRemaining: number;
    valueAtRisk: number;
  }>;
  recentMovements: Array<{
    id: string;
    productName: string;
    movementType: string;
    quantityChange: number;
    reason: string;
    createdAt: string;
  }>;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-bg-secondary rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="retail-card h-24 animate-pulse bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="retail-card p-6 text-sm text-status-danger">
        Could not load dashboard data. Please refresh the page.
      </div>
    );
  }

  const { summary, analytics, expiryAlerts, recentMovements, suggestions } = data;
  const salesChartData =
    chartMode === "daily" ? analytics.dailySales : analytics.monthlySales;

  const kpiCards = [
    {
      label: "Total Products",
      value: summary.totalProducts.toString(),
      icon: Package,
      tone: "default",
    },
    {
      label: "Available Stock",
      value: `${summary.availableStock} units`,
      icon: Boxes,
      tone: "default",
    },
    {
      label: "Today's Sales",
      value: formatINR(summary.todaysSales),
      icon: IndianRupee,
      tone: "success",
    },
    {
      label: "Total Stock Value",
      value: formatINR(summary.totalStockValue),
      icon: Wallet,
      tone: "default",
    },
    {
      label: "Nearing Expiry",
      value: `${summary.expiringSoonCount} batches`,
      icon: Clock,
      tone: summary.expiringSoonCount > 0 ? "warning" : "default",
    },
    {
      label: "Expired Products",
      value: `${summary.expiredCount} batches`,
      icon: AlertTriangle,
      tone: summary.expiredCount > 0 ? "danger" : "default",
    },
    {
      label: "Low Stock Items",
      value: `${summary.lowStockCount} items`,
      icon: TrendingDown,
      tone: summary.lowStockCount > 0 ? "warning" : "default",
    },
    {
      label: "Potential Expiry Loss",
      value: formatINR(summary.potentialLossFromExpiry),
      icon: ShieldAlert,
      tone: summary.potentialLossFromExpiry > 0 ? "danger" : "default",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            {data.shop.name}
          </h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Welcome back, {data.shop.ownerName}. Here is today&apos;s store overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/qr-scanner" className="retail-btn-secondary">
            <QrCode className="w-4 h-4 text-accent-olive" />
            <span>Scan QR</span>
          </Link>
          <Link href="/voice-entry" className="retail-btn-secondary">
            <Mic className="w-4 h-4 text-accent-olive" />
            <span>Voice Entry</span>
          </Link>
          <Link href="/bills-sales" className="retail-btn-secondary">
            <Receipt className="w-4 h-4 text-accent-olive" />
            <span>Upload Bill</span>
          </Link>
          <Link href="/inventory?add=1" className="retail-btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const iconColor =
            kpi.tone === "danger"
              ? "text-status-danger bg-status-danger-bg"
              : kpi.tone === "warning"
              ? "text-status-warning bg-status-warning-bg"
              : kpi.tone === "success"
              ? "text-status-success bg-status-success-bg"
              : "text-accent-olive bg-accent-sage-soft";

          return (
            <div key={kpi.label} className="retail-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-secondary">
                  {kpi.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${iconColor}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-semibold text-ink-primary mt-2">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Overview */}
        <div className="retail-card p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Sales Overview
              </h2>
              <p className="text-xs text-ink-secondary">
                Revenue and gross profit from recorded sales
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-border-warm bg-bg-secondary p-0.5 self-start">
              <button
                type="button"
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMode === "daily"
                    ? "bg-white text-ink-primary shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setChartMode("monthly")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMode === "monthly"
                    ? "bg-white text-ink-primary shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            {salesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-ink-secondary">
                No sales recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" vertical={false} />
                  <XAxis
                    dataKey={chartMode === "daily" ? "date" : "month"}
                    tick={{ fontSize: 11, fill: "#77786F" }}
                    axisLine={{ stroke: "#E8E6DF" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#77786F" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E8E6DF",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#292B27",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue (₹)"
                    fill="#68765B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="profit"
                    name="Gross Profit (₹)"
                    fill="#A5AF94"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Overview by Category */}
        <div className="retail-card p-5">
          <h2 className="text-base font-semibold text-ink-primary">
            Stock Overview
          </h2>
          <p className="text-xs text-ink-secondary mb-4">
            Available stock by product category
          </p>
          <div className="space-y-3.5">
            {analytics.categoryStock.length === 0 ? (
              <p className="text-xs text-ink-secondary">No active stock found.</p>
            ) : (
              analytics.categoryStock.map((cat) => {
                const maxQty = Math.max(
                  ...analytics.categoryStock.map((c) => c.quantity),
                  1
                );
                const pct = Math.round((cat.quantity / maxQty) * 100);
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-ink-primary">
                        {cat.category}
                      </span>
                      <span className="text-ink-secondary">
                        {cat.quantity} units · {formatINR(cat.value)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-olive"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Expiry Alerts, Smart Suggestions, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Expiry Alerts */}
        <div className="retail-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink-primary">
              Expiry Alerts
            </h2>
            <Link
              href="/expiry-alerts"
              className="text-xs font-medium text-accent-olive hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {expiryAlerts.length === 0 ? (
              <p className="text-xs text-ink-secondary">
                No products expiring within 30 days.
              </p>
            ) : (
              expiryAlerts.slice(0, 5).map((item) => (
                <div
                  key={item.batchId}
                  className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-ink-secondary">
                      Batch {item.batchNumber} · {item.quantity} {item.unit}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.daysRemaining < 0
                        ? "bg-status-danger-bg text-status-danger"
                        : item.daysRemaining <= 3
                        ? "bg-status-warning-bg text-status-warning"
                        : "bg-bg-secondary text-ink-secondary"
                    }`}
                  >
                    {item.daysRemaining < 0
                      ? "Expired"
                      : `${item.daysRemaining}d left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className="retail-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-olive" />
              <h2 className="text-base font-semibold text-ink-primary">
                Smart Suggestions
              </h2>
            </div>
            <Link
              href="/smart-suggestions"
              className="text-xs font-medium text-accent-olive hover:underline inline-flex items-center gap-1"
            >
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {suggestions.length === 0 ? (
              <p className="text-xs text-ink-secondary">
                All stock is moving well. No urgent discount suggestions.
              </p>
            ) : (
              suggestions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-bg-main border border-border-warm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink-primary truncate">
                      {s.productName}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-accent-olive bg-accent-sage-soft px-2 py-0.5 rounded-full">
                      {s.suggestedDiscountPercent}% off
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-1">
                    Batch {s.batchNumber} · {s.daysRemaining}d left · Avoid{" "}
                    {formatINR(s.potentialLossAvoided)} loss
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="retail-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink-primary">
              Recent Activity
            </h2>
            <Link
              href="/bills-sales"
              className="text-xs font-medium text-accent-olive hover:underline inline-flex items-center gap-1"
            >
              Sales log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-ink-secondary">No recent stock movements.</p>
            ) : (
              recentMovements.slice(0, 5).map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 rounded-lg bg-bg-main border border-border-warm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">
                      {mov.productName}
                    </p>
                    <p className="text-xs text-ink-secondary truncate">
                      {mov.reason}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      mov.quantityChange > 0
                        ? "text-status-success"
                        : "text-status-danger"
                    }`}
                  >
                    {mov.quantityChange > 0
                      ? `+${mov.quantityChange}`
                      : mov.quantityChange}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
