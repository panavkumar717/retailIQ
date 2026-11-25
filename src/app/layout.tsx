import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Retail IQ — Smart Retail Inventory & Loss Prevention",
  description:
    "Everyday inventory tracking, QR stock intake, voice entry, bill scanning, expiry alerts, and festive promotions for retail shopkeepers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="font-sans bg-bg-main text-ink-primary antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
