import React from "react";
import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="retail-card p-8 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-full bg-bg-secondary border border-border-warm flex items-center justify-center text-ink-secondary mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      <p className="text-xs text-ink-secondary mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
