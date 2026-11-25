import React from "react";
import { StockStatus } from "@/types/retail";

const STATUS_MAP: Record<
  StockStatus,
  { label: string; className: string }
> = {
  in_stock: {
    label: "In Stock",
    className: "bg-status-success-bg text-status-success border-status-success/20",
  },
  low_stock: {
    label: "Low Stock",
    className: "bg-status-warning-bg text-status-warning border-status-warning/25",
  },
  expiring_soon: {
    label: "Expiring Soon",
    className: "bg-status-warning-bg text-status-warning border-status-warning/25",
  },
  expired: {
    label: "Expired",
    className: "bg-status-danger-bg text-status-danger border-status-danger/25",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-bg-secondary text-ink-secondary border-border-warm",
  },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const config = STATUS_MAP[status] || STATUS_MAP.in_stock;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
