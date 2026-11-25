"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  QrCode,
  Mic,
  Receipt,
  Clock,
  Sparkles,
  Megaphone,
  Truck,
  Settings,
  Menu,
  X,
  Store,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "My Inventory", icon: Package },
  { href: "/bills-sales", label: "Bills & Sales", icon: Receipt },
  { href: "/expiry-alerts", label: "Expiry Alerts", icon: Clock },
  { href: "/smart-suggestions", label: "Smart Suggestions", icon: Sparkles },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_BOTTOM_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/qr-scanner", label: "Scan QR", icon: QrCode },
  { href: "/voice-entry", label: "Voice", icon: Mic },
  { href: "/inventory", label: "Stock", icon: Package },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentItem =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    ) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-bg-main text-ink-primary flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-border-warm">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border-warm">
          <div className="w-9 h-9 rounded-lg bg-accent-sage-soft border border-accent-sage/40 flex items-center justify-center text-accent-olive">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-ink-primary leading-tight">
              Retail IQ
            </p>
            <p className="text-[11px] text-ink-secondary">
              Store Inventory Manager
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-sage-soft text-accent-olive border border-accent-sage/40"
                    : "text-ink-secondary hover:bg-bg-secondary hover:text-ink-primary"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-accent-olive" : "text-ink-secondary"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-warm bg-bg-secondary/60">
          <p className="text-xs font-medium text-ink-primary">
            Daily Store Tip
          </p>
          <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
            Check Expiry Alerts every morning to clear near-expiry stock with timely discounts.
          </p>
        </div>
      </aside>

      {/* Mobile & Tablet Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-border-warm px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-sage-soft border border-accent-sage/40 flex items-center justify-center text-accent-olive">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary leading-none">
              Retail IQ
            </p>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              {currentItem.label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-bg-main px-3 py-1.5 text-xs font-medium text-ink-primary hover:bg-bg-secondary"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink-primary/25"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-border-warm flex flex-col z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-border-warm">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-accent-olive" />
                <span className="font-semibold text-sm text-ink-primary">
                  Retail IQ Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-accent-sage-soft text-accent-olive"
                        : "text-ink-secondary hover:bg-bg-secondary hover:text-ink-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border-warm grid grid-cols-4 h-16">
        {MOBILE_BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive ? "text-accent-olive" : "text-ink-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
